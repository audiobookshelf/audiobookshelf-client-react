'use client'

import { updateCollectionAction } from '@/app/actions/collectionActions'
import type { SortableListDragHandleProps } from '@/components/widgets/SortableList'
import CompilationItemListRow from '@/components/widgets/compilation/CompilationItemListRow'
import CompilationSortableList from '@/components/widgets/compilation/CompilationSortableList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookshelfEntity, Collection, LibraryItem } from '@/types/api'
import { useCallback, useMemo, useTransition } from 'react'

interface CollectionListProps {
  collection: Collection
  orderedBooks: LibraryItem[]
  setOrderedBooks: (next: LibraryItem[]) => void
  showReorder: boolean
}

export default function CollectionList({ collection, orderedBooks, setOrderedBooks, showReorder }: CollectionListProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate } = useUser()
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()

  const showDragHandle = userCanUpdate && showReorder
  const shelfEntitiesDense = useMemo(() => orderedBooks as unknown as (BookshelfEntity | null)[], [orderedBooks])

  const handleSortEnd = useCallback(
    (sortedItems: LibraryItem[]) => {
      const prev = orderedBooks
      setOrderedBooks(sortedItems)
      startTransition(async () => {
        try {
          await updateCollectionAction(collection.id, { books: sortedItems.map((b) => b.id) })
        } catch (error) {
          console.error('Failed to update collection order', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
          setOrderedBooks(prev)
        }
      })
    },
    [collection.id, orderedBooks, setOrderedBooks, showToast, t]
  )

  const renderItem = useCallback(
    (book: LibraryItem, index: number, dragHandle: SortableListDragHandleProps) => (
      <CompilationItemListRow
        libraryItem={book}
        context={{ kind: 'collection', collectionId: collection.id }}
        entityIndex={index}
        shelfEntities={shelfEntitiesDense}
        showDragHandle={showDragHandle}
        sortableDragHandleProps={dragHandle}
      />
    ),
    [collection.id, shelfEntitiesDense, showDragHandle]
  )

  return (
    <CompilationSortableList
      items={orderedBooks}
      onSortEnd={handleSortEnd}
      renderItem={renderItem}
      showReorder={showReorder}
      emptyMessage={t('MessageNoBooksFound')}
    />
  )
}
