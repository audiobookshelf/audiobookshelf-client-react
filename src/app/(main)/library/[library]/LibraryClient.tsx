'use client'

import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastEpisodeCard from '@/components/widgets/media-card/PodcastEpisodeCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { Author, BookshelfView, Library, LibraryItem, MediaProgress, PersonalizedShelf, Series, UserLoginResponse } from '@/types/api'
interface LibraryClientProps {
  library: Library
  personalized: PersonalizedShelf[]
  currentUser: UserLoginResponse
}

export default function LibraryClient({ library, personalized, currentUser }: LibraryClientProps) {
  const user = currentUser.user

  return (
    <div className="pl-8 py-8 space-y-8">
      {personalized.map((shelf) => (
        <div key={shelf.id}>
          <h4 className="text-base font-semibold mb-4">{shelf.label}</h4>
          <div className="flex gap-4 overflow-x-auto overflow-y-hidden w-full">
            {shelf.entities.map((entity) => {
              if (shelf.type === 'book' || shelf.type === 'podcast') {
                const EntityMediaCard = shelf.type === 'book' ? BookMediaCard : PodcastMediaCard
                const libraryItem = entity as LibraryItem
                const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.libraryItemId === libraryItem.id)

                return (
                  <EntityMediaCard
                    key={entity.id + '-' + shelf.id}
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
                  <SeriesCard
                    key={entity.id + '-' + shelf.id}
                    series={series}
                    libraryId={library.id}
                    bookshelfView={BookshelfView.DETAIL}
                    dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                    bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
                    bookProgressMap={bookProgressMap}
                  />
                )
              } else if (shelf.type === 'episode') {
                const libraryItem = entity as LibraryItem
                const episode = libraryItem.recentEpisode
                if (!episode) {
                  return null
                }
                const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.mediaItemId === episode.id)
                return (
                  <PodcastEpisodeCard
                    key={episode.id + '-' + shelf.id}
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
                )
              } else if (shelf.type === 'authors') {
                const author = entity as Author
                return <AuthorCard key={author.id + '-' + shelf.id} author={author} userCanUpdate={user.permissions.update} />
              }
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
