'use client'

import { updateCollectionAction } from '@/app/actions/collectionActions'
import CollectionBookListRow from '@/components/widgets/collection/CollectionBookListRow'
import SortableList from '@/components/widgets/SortableList'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookshelfEntity, Collection, LibraryItem } from '@/types/api'
import { useCallback, useMemo, useTransition } from 'react'

interface CollectionListClientProps {
  collection: Collection
  orderedBooks: LibraryItem[]
  setOrderedBooks: (next: LibraryItem[]) => void
  showReorder: boolean
}

export default function CollectionListClient({ collection, orderedBooks, setOrderedBooks, showReorder }: CollectionListClientProps) {
  const t = useTypeSafeTranslations()
  const { sizeMultiplier } = useCardSize()
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
    (book: LibraryItem, index: number, dragHandle: Parameters<typeof CollectionBookListRow>[0]['sortableDragHandleProps']) => (
      <CollectionBookListRow
        book={book}
        collectionId={collection.id}
        entityIndex={index}
        shelfEntities={shelfEntitiesDense}
        showDragHandle={showDragHandle}
        sortableDragHandleProps={dragHandle}
      />
    ),
    [collection.id, shelfEntitiesDense, showDragHandle]
  )

  if (orderedBooks.length === 0) {
    return (
      <div className="bg-primary/40 mt-6e w-full min-w-0" style={{ fontSize: sizeMultiplier + 'rem' }}>
        <div className="text-foreground-muted p-10e flex items-center justify-center">
          <p>{t('MessageNoBooksFound')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-primary/40 mt-6e w-full min-w-0" style={{ fontSize: sizeMultiplier + 'rem' }}>
      <SortableList items={orderedBooks} onSortEnd={handleSortEnd} renderItem={renderItem} disabled={!showReorder} className="w-full" />
    </div>
  )
}
