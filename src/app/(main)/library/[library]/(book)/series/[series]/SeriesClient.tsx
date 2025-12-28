'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { BookshelfView, GetLibraryItemsResponse, UserLoginResponse } from '@/types/api'

interface SeriesClientProps {
  currentUser: UserLoginResponse
  libraryItems: GetLibraryItemsResponse
}

export default function SeriesClient({ currentUser, libraryItems }: SeriesClientProps) {
  const { library } = useLibrary()
  const userMediaProgress = currentUser.user.mediaProgress
  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {libraryItems.results.map((libraryItem) => {
          const entityProgress = userMediaProgress.find((progress) => progress.libraryItemId === libraryItem.id)
          return (
            <BookMediaCard
              key={libraryItem.id}
              libraryItem={libraryItem}
              bookshelfView={BookshelfView.DETAIL}
              dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
              timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
              userPermissions={currentUser.user.permissions}
              ereaderDevices={currentUser.ereaderDevices}
              showSubtitles={true}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              mediaProgress={entityProgress}
            />
          )
        })}
      </div>
    </div>
  )
}
