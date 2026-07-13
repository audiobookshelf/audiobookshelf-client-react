'use client'

import { fetchLibraryPersonalizedAction } from '@/app/actions/libraryActions'
import BookShelfRow from '@/components/widgets/BookShelfRow'
import ItemSlider from '@/components/widgets/ItemSlider'
import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import SelectableShelfMediaCard from '@/components/widgets/media-card/SelectableShelfMediaCard'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { applyLibraryItemUpdateToShelves } from '@/lib/libraryItemUpdatedUtils'
import {
  applyAuthorAddedToNewestAuthorsShelf,
  applyAuthorRemovalToShelves,
  applyAuthorUpdateToShelves,
  applyEpisodeRemovalFromShelves,
  applyLibraryItemRemovalToShelves,
  applyLibraryItemsAddedToRecentlyAddedShelf,
  prunePersonalizedShelves
} from '@/lib/personalizedShelfUtils'
import {
  Author,
  AuthorRemovedPayload,
  AuthorsNumBooksUpdatedPayload,
  BookMetadata,
  BookshelfView,
  EpisodeAddedPayload,
  LibraryItem,
  LibraryItemRemovedPayload,
  MediaItemShare,
  MediaProgress,
  PersonalizedShelf,
  PersonalizedShelfType,
  RssFeed,
  Series,
  isPersonalizedSeriesRef
} from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { requestScanLibrary } from '../../settings/libraries/actions'
import LibraryEmptyState from './LibraryEmptyState'

interface LibraryClientProps {
  personalized: PersonalizedShelf[]
  libraryItemCount: number
}

/**
 * On user updated socket event, update shelves for continue listening and continue series
 */
function applyUserUpdatedToShelves(
  shelves: PersonalizedShelf[],
  mediaProgress: MediaProgress[],
  seriesHideFromContinueListening: string[]
): PersonalizedShelf[] {
  let changed = false
  let nextShelves = shelves

  if (seriesHideFromContinueListening.length) {
    const seriesIds = seriesHideFromContinueListening
    nextShelves = nextShelves.map((shelf) => {
      if (shelf.type !== 'book' || shelf.id !== 'continue-series') return shelf

      const nextEntities = (shelf.entities as LibraryItem[]).filter((entity) => {
        if (entity.mediaType !== 'book') return true
        const { series } = entity.media.metadata as BookMetadata
        const seriesId = series && isPersonalizedSeriesRef(series) ? series.id : null
        return !seriesId || !seriesIds.includes(seriesId)
      })

      if (nextEntities.length === shelf.entities.length) return shelf
      changed = true
      return { ...shelf, entities: nextEntities }
    })
  }

  const mediaProgressToHide = mediaProgress.filter((mp) => mp.hideFromContinueListening)
  if (mediaProgressToHide.length) {
    for (const shelfId of ['continue-listening', 'continue-reading'] as const) {
      nextShelves = nextShelves.map((shelf) => {
        if (shelf.id !== shelfId) return shelf

        if (shelf.type === 'book' || shelf.type === 'podcast') {
          const nextEntities = (shelf.entities as LibraryItem[]).filter((entity) => !mediaProgressToHide.some((mp) => mp.libraryItemId === entity.id))
          if (nextEntities.length === shelf.entities.length) return shelf
          changed = true
          return { ...shelf, entities: nextEntities }
        }

        if (shelf.type === 'episode') {
          const nextEntities = (shelf.entities as LibraryItem[]).filter((entity) => {
            if (!entity.recentEpisode) return true
            return !mediaProgressToHide.some((mp) => mp.libraryItemId === entity.id && mp.episodeId === entity.recentEpisode?.id)
          })
          if (nextEntities.length === shelf.entities.length) return shelf
          changed = true
          return { ...shelf, entities: nextEntities }
        }

        return shelf
      })
    }
  }

  return changed ? prunePersonalizedShelves(nextShelves) : shelves
}

export default function LibraryClient({ personalized, libraryItemCount: libraryItemCountProp }: LibraryClientProps) {
  const t = useTypeSafeTranslations()
  const [, startScanTransition] = useTransition()
  const { sizeMultiplier } = useCardSize()
  const { user, serverSettings, ereaderDevices, userIsAdminOrUp, getMediaItemProgress } = useUser()
  const { library, setContextMenuItems, setContextMenuActionHandler, homeBookshelfView } = useLibrary()

  const [shelves, setShelves] = useState(personalized)
  const [libraryItemCount, setLibraryItemCount] = useState(libraryItemCountProp)

  const visibleShelves = useMemo(() => prunePersonalizedShelves(shelves), [shelves])

  useEffect(() => {
    setShelves(personalized)
  }, [personalized])

  useEffect(() => {
    setLibraryItemCount(libraryItemCountProp)
  }, [libraryItemCountProp])

  /**
   * Updates entities within shelves of matching types.
   * Only triggers a re-render if the updater returns a new reference for at least one entity.
   * @param shelfTypes - Shelf types to apply the update to.
   * @param updater - Called for each entity; must return the same reference if unchanged.
   */
  const updateShelfEntities = useCallback(
    (shelfTypes: PersonalizedShelfType[], updater: (entity: LibraryItem | Series | Author) => LibraryItem | Series | Author) => {
      setShelves((prev) => {
        let shelvesChanged = false
        const nextShelves = prev.map((shelf) => {
          if (!shelfTypes.includes(shelf.type)) return shelf

          let changed = false
          const nextEntities = (shelf.entities as (LibraryItem | Series | Author)[]).map((entity) => {
            const next = updater(entity)
            if (next !== entity) changed = true
            return next
          })

          if (!changed) return shelf
          shelvesChanged = true
          return { ...shelf, entities: nextEntities } as PersonalizedShelf
        })
        return shelvesChanged ? nextShelves : prev
      })
    },
    []
  )

  // Shares only apply to book libraries
  const handleShareOpen = useCallback(
    (mediaItemShare: MediaItemShare) => {
      if (library.mediaType !== 'book') return

      updateShelfEntities(['book'], (entity) => {
        const li = entity as LibraryItem
        if (li.media?.id !== mediaItemShare.mediaItemId) return entity
        return { ...li, mediaItemShare }
      })
    },
    [library.mediaType, updateShelfEntities]
  )

  const handleShareClosed = useCallback(
    (mediaItemShare: MediaItemShare) => {
      if (library.mediaType !== 'book') return

      updateShelfEntities(['book'], (entity) => {
        const li = entity as LibraryItem
        if (li.media?.id !== mediaItemShare.mediaItemId) return entity
        return { ...li, mediaItemShare: undefined }
      })
    },
    [library.mediaType, updateShelfEntities]
  )

  // RSS feeds on home shelves are relevant for books and series
  const handleRssFeedOpen = useCallback(
    (rssFeed: RssFeed) => {
      if (library.mediaType !== 'book') return

      const shelfTypes: PersonalizedShelfType[] = rssFeed.entityType === 'libraryItem' ? ['book'] : rssFeed.entityType === 'series' ? ['series'] : []

      updateShelfEntities(shelfTypes, (entity) => {
        if (entity.id !== rssFeed.entityId) return entity
        return { ...entity, rssFeed }
      })
    },
    [library.mediaType, updateShelfEntities]
  )

  const handleRssFeedClosed = useCallback(
    (rssFeed: RssFeed) => {
      if (library.mediaType !== 'book') return

      const shelfTypes: PersonalizedShelfType[] = rssFeed.entityType === 'libraryItem' ? ['book'] : rssFeed.entityType === 'series' ? ['series'] : []

      updateShelfEntities(shelfTypes, (entity) => {
        if (entity.id !== rssFeed.entityId) return entity
        return { ...entity, rssFeed: undefined }
      })
    },
    [library.mediaType, updateShelfEntities]
  )

  const handleItemUpdated = useCallback((updatedItem: LibraryItem) => {
    setShelves((prev) => applyLibraryItemUpdateToShelves(prev, updatedItem))
  }, [])

  const shelvesRef = useRef(shelves)
  shelvesRef.current = shelves

  const refetchPersonalizedShelves = useCallback(() => {
    void fetchLibraryPersonalizedAction(library.id)
      .then((nextShelves) => {
        setShelves(nextShelves)
      })
      .catch((error) => {
        console.error('Failed to fetch personalized shelves', error)
      })
  }, [library.id])

  const handleItemRemoved = useCallback(
    (payload: LibraryItemRemovedPayload) => {
      if (payload.libraryId !== library.id) return
      setShelves((prev) => applyLibraryItemRemovalToShelves(prev, payload.id))
      setLibraryItemCount((prev) => Math.max(0, prev - 1))
    },
    [library.id]
  )

  const handleEpisodeDeleted = useCallback((libraryItemId: string, episodeId: string) => {
    setShelves((prev) => applyEpisodeRemovalFromShelves(prev, libraryItemId, episodeId))
  }, [])

  const handleItemAdded = useCallback(
    (libraryItem: LibraryItem) => {
      if (libraryItem.libraryId !== library.id) return
      setLibraryItemCount((prev) => prev + 1)
      refetchPersonalizedShelves()
    },
    [library.id, refetchPersonalizedShelves]
  )

  const handleItemsAdded = useCallback(
    (libraryItems: LibraryItem[]) => {
      const itemsInLibrary = libraryItems.filter((item) => item.libraryId === library.id)
      if (itemsInLibrary.length === 0) return

      setLibraryItemCount((prev) => prev + itemsInLibrary.length)

      // First items added to an empty library — refetch full personalized shelves
      if (prunePersonalizedShelves(shelvesRef.current).length === 0) {
        refetchPersonalizedShelves()
        return
      }

      setShelves((prev) => applyLibraryItemsAddedToRecentlyAddedShelf(prev, itemsInLibrary))
    },
    [library.id, refetchPersonalizedShelves]
  )

  const handleEpisodeAdded = useCallback(
    (payload: EpisodeAddedPayload) => {
      if (payload.libraryItem?.libraryId !== library.id) return
      refetchPersonalizedShelves()
    },
    [library.id, refetchPersonalizedShelves]
  )

  const handleAuthorUpdated = useCallback(
    (author: Author) => {
      if (author.libraryId !== undefined && author.libraryId !== library.id) return
      setShelves((prev) => applyAuthorUpdateToShelves(prev, author))
    },
    [library.id]
  )

  const handleAuthorsNumBooksUpdated = useCallback(
    (payload: AuthorsNumBooksUpdatedPayload) => {
      if (payload.libraryId !== library.id || payload.authors.length === 0) return
      setShelves((prev) => {
        let next = prev
        for (const author of payload.authors) {
          next = applyAuthorUpdateToShelves(next, author)
        }
        return next
      })
    },
    [library.id]
  )

  const handleAuthorAdded = useCallback(
    (author: Author) => {
      if (author.libraryId !== undefined && author.libraryId !== library.id) return
      setShelves((prev) => applyAuthorAddedToNewestAuthorsShelf(prev, author))
    },
    [library.id]
  )

  const handleAuthorRemoved = useCallback(
    (payload: AuthorRemovedPayload) => {
      if (payload.libraryId !== library.id) return
      setShelves((prev) => applyAuthorRemovalToShelves(prev, payload.id))
    },
    [library.id]
  )

  useLibraryItemUpdated(library.id, handleItemUpdated)

  useSocketEvent<LibraryItemRemovedPayload>('item_removed', handleItemRemoved)
  useSocketEvent<LibraryItem>('item_added', handleItemAdded)
  useSocketEvent<LibraryItem[]>('items_added', handleItemsAdded)
  useSocketEvent<EpisodeAddedPayload>('episode_added', handleEpisodeAdded)
  useSocketEvent<Author>('author_added', handleAuthorAdded)
  useSocketEvent<Author>('author_updated', handleAuthorUpdated)
  useSocketEvent<AuthorsNumBooksUpdatedPayload>('authors_num_books_updated', handleAuthorsNumBooksUpdated)
  useSocketEvent<AuthorRemovedPayload>('author_removed', handleAuthorRemoved)
  useSocketEvent<MediaItemShare>('share_open', handleShareOpen)
  useSocketEvent<MediaItemShare>('share_closed', handleShareClosed)
  useSocketEvent<RssFeed>('rss_feed_open', handleRssFeedOpen)
  useSocketEvent<RssFeed>('rss_feed_closed', handleRssFeedClosed)

  useEffect(() => {
    setShelves((prev) => applyUserUpdatedToShelves(prev, user.mediaProgress, user.seriesHideFromContinueListening))
  }, [user.mediaProgress, user.seriesHideFromContinueListening])

  useEffect(() => {
    const items = []

    if (userIsAdminOrUp) {
      items.push({
        text: t('ButtonScanLibrary'),
        action: 'scan'
      })
    }

    setContextMenuItems(items)

    setContextMenuActionHandler((action) => {
      if (action === 'scan') {
        startScanTransition(async () => {
          try {
            await requestScanLibrary(library.id)
          } catch (error) {
            console.error('Failed to start library scan', error)
          }
        })
      }
    })

    return () => {
      setContextMenuItems([])
      setContextMenuActionHandler(() => {})
    }
  }, [userIsAdminOrUp, library.id, setContextMenuItems, setContextMenuActionHandler, t, startScanTransition])

  return (
    <div className="pb-20" style={{ fontSize: sizeMultiplier + 'rem' }}>
      {/* empty state with scan button if user is admin or root */}
      {visibleShelves.length === 0 && (
        <div className="py-8">
          <LibraryEmptyState
            library={library}
            showScanButton={['admin', 'root'].includes(user.type)}
            variant={libraryItemCount === 0 ? 'library-empty' : 'no-home-shelves'}
          />
        </div>
      )}

      {/* bookshelf rows */}
      {visibleShelves.map((shelf) => {
        const Wrapper = homeBookshelfView === BookshelfView.STANDARD ? BookShelfRow : ItemSlider
        const continueListeningShelf = shelf.id === 'continue-listening' || shelf.id === 'continue-reading'
        const continueSeriesShelf = shelf.id === 'continue-series'

        return (
          <Wrapper key={shelf.id} title={shelf.label}>
            {shelf.entities.map((entity, entityIndex) => {
              if (shelf.type === 'book' || shelf.type === 'podcast' || shelf.type === 'episode') {
                const libraryItem = entity as LibraryItem
                const mediaProgress =
                  shelf.type === 'episode' && libraryItem.recentEpisode
                    ? getMediaItemProgress(libraryItem.recentEpisode.id)
                    : libraryItem.media?.id
                      ? getMediaItemProgress(libraryItem.media.id)
                      : undefined

                if (shelf.type === 'episode' && !libraryItem.recentEpisode) {
                  return null
                }

                let key = shelf.type === 'episode' && libraryItem.recentEpisode ? `${libraryItem.recentEpisode.id}-${shelf.id}` : `${entity.id}-${shelf.id}`

                if (continueSeriesShelf && shelf.type === 'book') {
                  const { series } = libraryItem.media.metadata as BookMetadata
                  key += '-' + (series && isPersonalizedSeriesRef(series) ? series.id : '')
                }

                return (
                  <div key={key} className="mx-2e shrink-0">
                    <SelectableShelfMediaCard
                      scopeId={shelf.id}
                      libraryItem={libraryItem}
                      cardType={shelf.type}
                      bookshelfView={homeBookshelfView}
                      dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
                      userPermissions={user.permissions}
                      ereaderDevices={ereaderDevices}
                      showSubtitles
                      mediaProgress={mediaProgress}
                      shelfEntities={shelf.entities}
                      entityIndex={entityIndex}
                      continueListeningShelf={continueListeningShelf}
                      continueSeriesShelf={shelf.type === 'book' && continueSeriesShelf}
                      onDeleteSuccess={
                        shelf.type === 'episode' && libraryItem.recentEpisode
                          ? () => handleEpisodeDeleted(libraryItem.id, libraryItem.recentEpisode!.id)
                          : undefined
                      }
                    />
                  </div>
                )
              } else if (shelf.type === 'series') {
                const series = entity as Series
                const libraryItems = series.books || []
                const mediaItemProgressMap = new Map<string, MediaProgress>()
                libraryItems.forEach((libraryItem) => {
                  const mediaProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined
                  if (mediaProgress) {
                    const key = mediaProgress.mediaItemId ?? libraryItem.media?.id
                    if (key) mediaItemProgressMap.set(key, mediaProgress)
                  }
                })
                return (
                  <div key={entity.id + '-' + shelf.id} className="mx-2e shrink-0">
                    <SeriesCard
                      series={series}
                      libraryId={library.id}
                      bookshelfView={homeBookshelfView}
                      dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      mediaItemProgressMap={mediaItemProgressMap}
                    />
                  </div>
                )
              } else if (shelf.type === 'authors') {
                const author = entity as Author
                return (
                  <div key={author.id + '-' + shelf.id} className="mx-2e shrink-0">
                    <AuthorCard author={author} />
                  </div>
                )
              }
            })}
          </Wrapper>
        )
      })}
    </div>
  )
}
