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
import { Author, BookshelfView, LibraryItem, MediaProgress, PersonalizedShelf, Series, UserLoginResponse } from '@/types/api'
import { useEffect } from 'react'
import LibraryEmptyState from './LibraryEmptyState'

interface LibraryClientProps {
  personalized: PersonalizedShelf[]
  currentUser: UserLoginResponse
}

export default function LibraryClient({ personalized, currentUser }: LibraryClientProps) {
  const { sizeMultiplier } = useCardSize()
  const { library, setContextMenuItems, setContextMenuActionHandler, bookshelfView, boundModal } = useLibrary()

  useEffect(() => {
    const items = []

    if (currentUser.user.permissions.update) {
      items.push({
        text: 'Scan Library',
        action: 'scan'
      })
      items.push({
        text: 'Edit Library',
        action: 'edit'
      })
    }

    setContextMenuItems(items)

    setContextMenuActionHandler((action) => {
      console.log('Library action:', action)
      if (action === 'scan') {
        // TODO: Implement scan
      } else if (action === 'edit') {
        // TODO: Implement edit
      }
    })

    return () => {
      setContextMenuItems([])
      setContextMenuActionHandler(() => {})
    }
  }, [currentUser.user.permissions.update, setContextMenuItems, setContextMenuActionHandler])

  return (
    <div style={{ fontSize: sizeMultiplier + 'rem' }}>
      {/* empty state with scan button if user is admin or root */}
      {personalized.length === 0 && (
        <div className="py-8">
          <LibraryEmptyState library={library} showScanButton={['admin', 'root'].includes(currentUser.user.type)} />
        </div>
      )}

      {/* bookshelf rows */}
      {personalized.map((shelf) => {
        const Wrapper = bookshelfView === BookshelfView.STANDARD ? BookShelfRow : ItemSlider

        return (
          <Wrapper key={shelf.id} title={shelf.label}>
            {shelf.entities.map((entity) => {
              if (shelf.type === 'book' || shelf.type === 'podcast') {
                const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
                const libraryItem = entity as LibraryItem
                const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.libraryItemId === libraryItem.id)

                return (
                  <div key={entity.id + '-' + shelf.id} className="shrink-0 mx-2e">
                    <EntityMediaCard
                      libraryItem={libraryItem}
                      bookshelfView={bookshelfView}
                      dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                      userPermissions={currentUser.user.permissions}
                      ereaderDevices={currentUser.ereaderDevices}
                      showSubtitles={true}
                      bookCoverAspectRatio={library?.settings?.coverAspectRatio ?? 1}
                      mediaProgress={mediaProgress}
                    />
                  </div>
                )
              } else if (shelf.type === 'series') {
                const series = entity as Series
                const libraryItems = series.books || []
                const bookProgressMap = new Map<string, MediaProgress>()
                libraryItems.forEach((libraryItem) => {
                  const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.libraryItemId === libraryItem.id)
                  if (mediaProgress) {
                    bookProgressMap.set(libraryItem.id, mediaProgress)
                  }
                })
                return (
                  <div key={entity.id + '-' + shelf.id} className="shrink-0 mx-2e">
                    <SeriesCard
                      series={series}
                      libraryId={library.id}
                      bookshelfView={bookshelfView}
                      dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
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
                const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.mediaItemId === episode.id)
                return (
                  <div key={episode.id + '-' + shelf.id} className="shrink-0 mx-2e">
                    <PodcastEpisodeCard
                      libraryItem={libraryItem}
                      bookshelfView={bookshelfView}
                      dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                      timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                      userPermissions={currentUser.user.permissions}
                      ereaderDevices={currentUser.ereaderDevices}
                      showSubtitles={true}
                      bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
                      mediaProgress={mediaProgress}
                    />
                  </div>
                )
              } else if (shelf.type === 'authors') {
                const author = entity as Author
                return (
                  <div key={author.id + '-' + shelf.id} className="shrink-0 mx-2e">
                    <AuthorCard author={author} user={currentUser.user} />
                  </div>
                )
              }
            })}
          </Wrapper>
        )
      })}
      {boundModal}
    </div>
  )
}
