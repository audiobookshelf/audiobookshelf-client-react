'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { BookshelfView, GetLibraryItemsResponse } from '@/types/api'

interface SeriesClientProps {
  libraryItems: GetLibraryItemsResponse
}

export default function SeriesClient({ libraryItems }: SeriesClientProps) {
  const { library } = useLibrary()
  const { user, serverSettings, ereaderDevices } = useUser()
  const userMediaProgress = user.mediaProgress
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
              dateFormat={serverSettings.dateFormat}
              timeFormat={serverSettings.timeFormat}
              userPermissions={user.permissions}
              ereaderDevices={ereaderDevices}
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
