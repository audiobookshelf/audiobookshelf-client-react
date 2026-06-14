'use client'

import {
  SortableBookshelfProvider,
  usePrimaryInputCanHover,
  type SortableBookshelfContextType,
  type SortableBookshelfOverlayMode
} from '@/contexts/SortableBookshelfContext'
import { useUser } from '@/contexts/UserContext'
import { useCollectionBooks } from '@/hooks/useCollectionBooks'
import type { CollectionDisplayMode } from '@/hooks/useCollectionDisplayMode'
import type { Collection } from '@/types/api'
import { useMemo } from 'react'
import CollectionBookshelfClient from './CollectionBookshelfClient'
import CollectionListClient from './CollectionListClient'

interface CollectionItemsClientProps {
  collection: Collection
  displayMode: CollectionDisplayMode
  mobileReorderActive: boolean
}

export default function CollectionItemsClient({ collection, displayMode, mobileReorderActive }: CollectionItemsClientProps) {
  const { userCanUpdate } = useUser()
  const primaryInputCanHover = usePrimaryInputCanHover()
  const { orderedBooks, setOrderedBooks, handleLibraryItemRemovedFromSortableList } = useCollectionBooks(collection)

  const canReorder = userCanUpdate
  const showReorder = canReorder && (primaryInputCanHover || mobileReorderActive)

  const sortableBookshelf = useMemo((): SortableBookshelfContextType => {
    const overlayMode: SortableBookshelfOverlayMode = showReorder && !primaryInputCanHover ? 'pinned' : 'hover'
    return {
      sortableListId: collection.id,
      sortableListKind: 'collection',
      onLibraryItemRemovedFromSortableList: handleLibraryItemRemovedFromSortableList,
      overlayMode
    }
  }, [collection.id, handleLibraryItemRemovedFromSortableList, showReorder, primaryInputCanHover])

  return (
    <SortableBookshelfProvider value={sortableBookshelf}>
      {displayMode === 'bookshelf' ? (
        <CollectionBookshelfClient collection={collection} orderedBooks={orderedBooks} setOrderedBooks={setOrderedBooks} showReorder={showReorder} />
      ) : (
        <CollectionListClient collection={collection} orderedBooks={orderedBooks} setOrderedBooks={setOrderedBooks} showReorder={showReorder} />
      )}
    </SortableBookshelfProvider>
  )
}
