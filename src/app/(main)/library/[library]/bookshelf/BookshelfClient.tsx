'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import PodcastMediaCard from '@/components/widgets/media-card/PodcastMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { BookshelfView, GetLibraryItemsResponse, Library, UserLoginResponse } from '@/types/api'
import { useEffect } from 'react'

interface BookshelfClientProps {
  library: Library
  libraryItemsData: GetLibraryItemsResponse
  currentUser: UserLoginResponse
}

export default function BookshelfClient({ library, libraryItemsData, currentUser }: BookshelfClientProps) {
  const { setItemCount } = useLibrary()
  const isPodcastLibrary = library.mediaType === 'podcast'

  useEffect(() => {
    // Send the item count to the toolbar
    setItemCount(libraryItemsData.total ?? 0)
  }, [libraryItemsData, setItemCount])

  const results = libraryItemsData.results
  const userMediaProgress = currentUser.user.mediaProgress

  const EntityMediaCard = isPodcastLibrary ? PodcastMediaCard : BookMediaCard

  return (
    <div>
      <div className="flex justify-center flex-wrap gap-4">
        {results.map((result) => {
          const entityProgress = isPodcastLibrary ? null : userMediaProgress.find((progress) => progress.libraryItemId === result.id)
          return (
            <EntityMediaCard
              key={result.id}
              libraryItem={result}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              mediaProgress={entityProgress}
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
