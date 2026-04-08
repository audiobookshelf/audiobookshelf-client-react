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
import { Author, BookshelfView, LibraryItem, MediaItemShare, MediaProgress, PersonalizedShelf, PersonalizedShelfType, RssFeed, Series } from '@/types/api'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { requestScanLibrary } from '../../settings/libraries/actions'
import LibraryEmptyState from './LibraryEmptyState'

interface LibraryClientProps {
  personalized: PersonalizedShelf[]
}

export default function LibraryClient({ personalized }: LibraryClientProps) {
  const t = useTypeSafeTranslations()
  const [, startScanTransition] = useTransition()
  const { sizeMultiplier } = useCardSize()
  const { user, serverSettings, ereaderDevices, userIsAdminOrUp, getLibraryItemProgress, getEpisodeProgress } = useUser()
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
    <div style={{ fontSize: sizeMultiplier + 'rem' }}>
      {/* empty state with scan button if user is admin or root */}
      {shelves.length === 0 && (
        <div className="py-8">
          <LibraryEmptyState library={library} showScanButton={['admin', 'root'].includes(user.type)} />
        </div>
      )}

      {/* bookshelf rows */}
      {shelves.map((shelf) => {
        const Wrapper = homeBookshelfView === BookshelfView.STANDARD ? BookShelfRow : ItemSlider

        return (
          <Wrapper key={shelf.id} title={shelf.label}>
            {shelf.entities.map((entity, entityIndex) => {
              if (shelf.type === 'book' || shelf.type === 'podcast') {
                const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
                const libraryItem = entity as LibraryItem
                const mediaProgress = getLibraryItemProgress(libraryItem.id)

                return (
                  <div key={entity.id + '-' + shelf.id} className="mx-2e shrink-0">
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
                    />
                  </div>
                )
              } else if (shelf.type === 'series') {
                const series = entity as Series
                const libraryItems = series.books || []
                const bookProgressMap = new Map<string, MediaProgress>()
                libraryItems.forEach((libraryItem) => {
                  const mediaProgress = getLibraryItemProgress(libraryItem.id)
                  if (mediaProgress) {
                    bookProgressMap.set(libraryItem.id, mediaProgress)
                  }
                })
                return (
                  <div key={entity.id + '-' + shelf.id} className="mx-2e shrink-0">
                    <SeriesCard
                      series={series}
                      libraryId={library.id}
                      bookshelfView={homeBookshelfView}
                      dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      bookProgressMap={bookProgressMap}
                    />
                  </div>
                )
              } else if (shelf.type === 'episode') {
                const libraryItem = entity as LibraryItem
                const episode = libraryItem.recentEpisode
                if (!episode) {
                  return null
                }
                const mediaProgress = getEpisodeProgress(episode.id)
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
