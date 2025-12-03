'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useLibraryItems } from '@/contexts/LibraryItemsContext'
import { BookshelfView, GetLibraryItemsResponse, Library, UserLoginResponse } from '@/types/api'
import { useEffect } from 'react'

interface BookshelfClientProps {
  library: Library
  libraryItemsData: GetLibraryItemsResponse
  currentUser: UserLoginResponse
}

export default function BookshelfClient({ library, libraryItemsData, currentUser }: BookshelfClientProps) {
  const { setItemCount } = useLibraryItems()
  const isPodcastLibrary = library.mediaType === 'podcast'

  useEffect(() => {
    // Send the item count to the toolbar
    setItemCount(libraryItemsData.total ?? 0)
  }, [libraryItemsData, setItemCount])

  const results = libraryItemsData.results

  const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {results.map((result) => {
          return (
            <EntityMediaCard
              key={result.id}
              libraryItem={result}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              isSelectionMode={false}
              selected={false}
              onSelect={() => {}}
              dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
              timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
              userPermissions={currentUser.user.permissions}
              ereaderDevices={currentUser.ereaderDevices}
              showSubtitles={true}
            />
          )
        })}
      </div>
    </div>
  )
}
