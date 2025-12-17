'use client'

import ItemSlider from '@/components/widgets/ItemSlider'
import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { useCardSize } from '@/contexts/CardSizeContext'
import { Author, BookshelfView, Library, LibraryItem, MediaProgress, PersonalizedShelf, Series, UserLoginResponse } from '@/types/api'
interface LibraryClientProps {
  library: Library
  personalized: PersonalizedShelf[]
  currentUser: UserLoginResponse
}

export default function LibraryClient({ library, personalized, currentUser }: LibraryClientProps) {
  const user = currentUser.user
  const { sizeMultiplier } = useCardSize()

  return (
    <div className="ps-4e py-4e space-y-2e" style={{ fontSize: sizeMultiplier + 'rem' }}>
      {personalized.map((shelf) => (
        <ItemSlider key={shelf.id} title={shelf.label}>
          {shelf.entities.map((entity) => {
            if (shelf.type === 'book' || shelf.type === 'podcast') {
              const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
              const libraryItem = entity as LibraryItem
              const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.libraryItemId === libraryItem.id)

              return (
                <div key={entity.id + '-' + shelf.id} className="shrink-0">
                  <EntityMediaCard
                    libraryItem={libraryItem}
                    bookshelfView={BookshelfView.DETAIL}
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
                <div key={entity.id + '-' + shelf.id} className="shrink-0">
                  <SeriesCard
                    series={series}
                    libraryId={library.id}
                    bookshelfView={BookshelfView.DETAIL}
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
                <div key={episode.id + '-' + shelf.id} className="shrink-0">
                  <PodcastEpisodeCard
                    libraryItem={libraryItem}
                    bookshelfView={BookshelfView.DETAIL}
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
                <div key={author.id + '-' + shelf.id} className="shrink-0">
                  <AuthorCard author={author} userCanUpdate={user.permissions.update} />
                </div>
              )
            }
          })}
        </ItemSlider>
      ))}
    </div>
  )
}
