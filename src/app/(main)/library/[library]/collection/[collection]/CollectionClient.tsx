'use client'

import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { useLibrary } from '@/contexts/LibraryContext'
import { useLibraryDataContext } from '@/contexts/LibraryDataContext'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { BookshelfView, Collection, LibraryItem } from '@/types/api'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface CollectionClientProps {
  collection: Collection
}

export default function CollectionClient({ collection }: CollectionClientProps) {
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

  const { getItemsArray, isLoading } = useLibraryDataContext<LibraryItem>('collection', collection.id, null, library.id)

  const sortedItems = getItemsArray()

  const coverAspectRatio = getCoverAspectRatio(library.settings?.coverAspectRatio ?? 1)
  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  return (
    <div>
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start mb-8">
        <CollectionGroupCover books={collection.books ?? []} width={coverWidth * 2} height={coverHeight} bookCoverAspectRatio={coverAspectRatio} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
          {collection.description && <p className="text-fg/70">{collection.description}</p>}
        </div>
      </div>

      {isLoading && sortedItems.length === 0 && <div>Loading...</div>}

      <div className="flex flex-wrap gap-4">
        {sortedItems.map((book, index) => (
          <BookMediaCard
            key={book.id}
            id={`temp-focus-${index}`}
            libraryItem={book}
            bookshelfView={BookshelfView.DETAIL}
            bookCoverAspectRatio={coverAspectRatio}
            dateFormat={'MM/dd/yyyy'}
            timeFormat={'HH:mm'}
            userPermissions={{
              delete: false,
              update: false,
              download: false,
              upload: false,
              createEreader: false,
              accessAllLibraries: true,
              accessAllTags: true,
              accessExplicitContent: true,
              selectedTagsNotAccessible: false
            }} // TODO: Pass real permissions from props if available
            ereaderDevices={[]} // TODO: Pass real devices
            showSubtitles={true}
            navigationContext={{
              name: 'collection',
              id: collection.id,
              index
            }}
          />
        ))}
      </div>
    </div>
  )
}
