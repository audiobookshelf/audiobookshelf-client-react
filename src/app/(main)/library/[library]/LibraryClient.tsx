'use client'

import BookShelfRow from '@/components/widgets/BookShelfRow'
import ItemSlider from '@/components/widgets/ItemSlider'
import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  Author,
  BookMetadata,
  BookshelfView,
  LibraryItem,
  MediaItemShare,
  MediaProgress,
  PersonalizedShelf,
  PersonalizedShelfType,
  RssFeed,
  Series,
  isPersonalizedSeriesRef
} from '@/types/api'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { requestScanLibrary } from '../../settings/libraries/actions'
import LibraryEmptyState from './LibraryEmptyState'

interface LibraryClientProps {
  personalized: PersonalizedShelf[]
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

  return changed ? nextShelves : shelves
}

export default function LibraryClient({ personalized }: LibraryClientProps) {
  const t = useTypeSafeTranslations()
  const [, startScanTransition] = useTransition()
  const { sizeMultiplier } = useCardSize()
  const { user, serverSettings, ereaderDevices, userIsAdminOrUp, getMediaItemProgress } = useUser()
  const { library, setContextMenuItems, setContextMenuActionHandler, homeBookshelfView } = useLibrary()

  const [shelves, setShelves] = useState(personalized)

  useEffect(() => {
    setShelves(personalized)
  }, [personalized])

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
      {shelves.length === 0 && (
        <div className="py-8">
          <LibraryEmptyState library={library} showScanButton={['admin', 'root'].includes(user.type)} />
        </div>
      )}

      {/* bookshelf rows */}
      {shelves.map((shelf) => {
        const Wrapper = homeBookshelfView === BookshelfView.STANDARD ? BookShelfRow : ItemSlider
        const continueListeningShelf = shelf.id === 'continue-listening' || shelf.id === 'continue-reading'
        const continueSeriesShelf = shelf.id === 'continue-series'

        return (
          <Wrapper key={shelf.id} title={shelf.label}>
            {shelf.entities.map((entity, entityIndex) => {
              if (shelf.type === 'book' || shelf.type === 'podcast') {
                const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
                const libraryItem = entity as LibraryItem
                const mediaProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined

                let key = entity.id + '-' + shelf.id

                // continue series can have multiple of the same book on the shelf with different series
                if (continueSeriesShelf) {
                  const { series } = libraryItem.media.metadata as BookMetadata
                  key += '-' + (series && isPersonalizedSeriesRef(series) ? series.id : '')
                }
                return (
                  <div key={key} className="mx-2e shrink-0">
                    <EntityMediaCard
                      libraryItem={libraryItem}
                      bookshelfView={homeBookshelfView}
                      dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
                      userPermissions={user.permissions}
                      ereaderDevices={ereaderDevices}
                      showSubtitles={true}
                      mediaProgress={mediaProgress}
                      shelfEntities={shelf.entities}
                      entityIndex={entityIndex}
                      continueListeningShelf={continueListeningShelf}
                      continueSeriesShelf={shelf.type === 'book' && continueSeriesShelf}
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
              } else if (shelf.type === 'episode') {
                const libraryItem = entity as LibraryItem
                const episode = libraryItem.recentEpisode
                if (!episode) {
                  return null
                }
                const mediaProgress = getMediaItemProgress(episode.id)
                return (
                  <div key={episode.id + '-' + shelf.id} className="mx-2e shrink-0">
                    <PodcastEpisodeCard
                      libraryItem={libraryItem}
                      bookshelfView={homeBookshelfView}
                      dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      timeFormat={serverSettings?.timeFormat ?? 'HH:mm'}
                      userPermissions={user.permissions}
                      ereaderDevices={ereaderDevices}
                      showSubtitles={true}
                      mediaProgress={mediaProgress}
                      continueListeningShelf={continueListeningShelf}
                      shelfEntities={shelf.entities}
                      entityIndex={entityIndex}
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
