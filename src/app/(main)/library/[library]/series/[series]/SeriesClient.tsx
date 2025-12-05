import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { BookshelfView, GetLibraryItemsResponse, Library, UserLoginResponse } from '@/types/api'

interface SeriesClientProps {
  currentUser: UserLoginResponse
  library: Library
  libraryItems: GetLibraryItemsResponse
}

export default function SeriesClient({ currentUser, library, libraryItems }: SeriesClientProps) {
  return (
    <div>
      <div className="flex justify-center flex-wrap gap-4">
        {libraryItems.results.map((libraryItem) => (
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
          />
        ))}
      </div>
    </div>
  )
}
