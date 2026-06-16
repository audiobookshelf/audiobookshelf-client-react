'use client'

import { SortableBookshelfOverlayProvider } from '@/contexts/SortableBookshelfOverlayContext'
import { SortableCompilationProvider } from '@/contexts/SortableCompilationContext'
import { useCompilationSortableContext } from '@/hooks/useCompilationSortableContext'
import type { CollectionDisplayMode } from '@/hooks/useCollectionDisplayMode'
import type { Collection, LibraryItem } from '@/types/api'
import CollectionBookshelf from './CollectionBookshelf'
import CollectionList from './CollectionList'

interface CollectionItemsProps {
  collection: Collection
  displayMode: CollectionDisplayMode
  mobileReorderActive: boolean
  orderedBooks: LibraryItem[]
  setOrderedBooks: (next: LibraryItem[]) => void
  onItemRemoved: (libraryItemId: string, episodeId?: string | null) => void
}

export default function CollectionItems({ collection, displayMode, mobileReorderActive, orderedBooks, setOrderedBooks, onItemRemoved }: CollectionItemsProps) {
  const { showReorder, sortableCompilation, bookshelfOverlayMode } = useCompilationSortableContext(
    collection.id,
    'collection',
    mobileReorderActive,
    onItemRemoved
  )

  return (
    <SortableCompilationProvider value={sortableCompilation}>
      {displayMode === 'bookshelf' ? (
        <SortableBookshelfOverlayProvider overlayMode={bookshelfOverlayMode}>
          <CollectionBookshelf collection={collection} orderedBooks={orderedBooks} setOrderedBooks={setOrderedBooks} showReorder={showReorder} />
        </SortableBookshelfOverlayProvider>
      ) : (
        <CollectionList collection={collection} orderedBooks={orderedBooks} setOrderedBooks={setOrderedBooks} showReorder={showReorder} />
      )}
    </SortableCompilationProvider>
  )
}
