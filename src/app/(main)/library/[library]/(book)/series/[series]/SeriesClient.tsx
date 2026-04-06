'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { useUser } from '@/contexts/UserContext'
import { BookshelfView, GetLibraryItemsResponse } from '@/types/api'

interface SeriesClientProps {
  libraryItems: GetLibraryItemsResponse
}

export default function SeriesClient({ libraryItems }: SeriesClientProps) {
  const { user, serverSettings, ereaderDevices, getLibraryItemProgress } = useUser()
  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {libraryItems.results.map((libraryItem) => {
          const entityProgress = getLibraryItemProgress(libraryItem.id)
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
              mediaProgress={entityProgress}
            />
          )
        })}
      </div>
    </div>
  )
}
