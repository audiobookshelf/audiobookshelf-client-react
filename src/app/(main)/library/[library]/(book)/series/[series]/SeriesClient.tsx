'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { useLibraryDataContext } from '@/contexts/LibraryDataContext'
import { BookshelfView, GetLibraryItemsResponse, LibraryItem, UserLoginResponse } from '@/types/api'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface SeriesClientProps {
  currentUser: UserLoginResponse
  libraryItems: GetLibraryItemsResponse
  seriesId: string
}

export default function SeriesClient({ currentUser, seriesId }: Omit<SeriesClientProps, 'libraryItems'>) {
  const { library } = useLibrary()
  const searchParams = useSearchParams()
  const focusIndex = parseInt(searchParams.get('focusIndex') || '', 10)

  // Scroll to focused item
  useEffect(() => {
    if (isNaN(focusIndex)) return
    const el = document.getElementById(`temp-focus-${focusIndex}`)
    if (el) {
      el.scrollIntoView({ block: 'center', inline: 'center' })
      el.focus({ preventScroll: true })
    }
  }, [focusIndex])
  const { getItemsArray, isLoading } = useLibraryDataContext<LibraryItem>('books-in-series', seriesId, null, library.id)

  const sortedItems = getItemsArray()

  const userMediaProgress = currentUser.user.mediaProgress

  if (isLoading && sortedItems.length === 0) return <div>Loading...</div>

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {sortedItems.map((libraryItem, index) => {
          const entityProgress = userMediaProgress.find((progress) => progress.libraryItemId === libraryItem.id)
          return (
            <BookMediaCard
              key={libraryItem.id}
              id={`temp-focus-${index}`}
              libraryItem={libraryItem}
              bookshelfView={BookshelfView.DETAIL}
              dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
              timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
              userPermissions={currentUser.user.permissions}
              ereaderDevices={currentUser.ereaderDevices}
              showSubtitles={true}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              mediaProgress={entityProgress}
              navigationContext={{
                name: 'books-in-series',
                id: seriesId,
                index
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
