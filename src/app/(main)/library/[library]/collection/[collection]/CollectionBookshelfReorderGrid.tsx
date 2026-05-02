'use client'

import { updateCollectionAction } from '@/app/actions/collectionActions'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookshelfEntity, BookshelfView, LibraryItem, MediaProgress } from '@/types/api'
import { animations, type DragendEvent, type DragstartEvent } from '@formkit/drag-and-drop'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useTransition } from 'react'
import CollectionBookCardShell from './CollectionBookCardShell'

/**
 * When true, FormKit's `animations` plugin runs short slide keyframes while reordering
 * (can feel busy on dense grids). Flip here to experiment.
 */
const ENABLE_COLLECTION_REORDER_SLIDE_ANIMATIONS = true

const collectionReorderAnimationPlugins = ENABLE_COLLECTION_REORDER_SLIDE_ANIMATIONS ? [animations({ duration: 500, xScale: 16, yScale: 16 })] : undefined

export interface CollectionBookshelfReorderGridProps {
  books: LibraryItem[]
  setBooks: (next: LibraryItem[]) => void
  /** Order-independent fingerprint (same as SortableList) so setDragItems runs on add/remove/metadata, not on reorder-only. */
  itemsContentHash: string
  collectionId: string
  columns: number
  cardWidth: number
  cardMargin: number
  dividerHeight: number
  sizeMultiplier: number
  bookshelfMarginLeft: number
  libraryId: string
  bookshelfView: BookshelfView
  showSubtitles: boolean
  seriesSortBy: string
  mediaItemProgressMap: Map<string, MediaProgress>
}

/**
 * Isolated mount so `useDragAndDrop`'s init effect runs when `ref` is already on a real DOM node.
 * (FormKit's hook only re-inits when `values` changes; if the grid mounts later, the parent ref was null on first run.)
 */
export default function CollectionBookshelfReorderGrid({
  books,
  setBooks,
  itemsContentHash,
  collectionId,
  columns,
  cardWidth,
  cardMargin,
  dividerHeight,
  sizeMultiplier,
  bookshelfMarginLeft,
  libraryId,
  bookshelfView,
  showSubtitles,
  seriesSortBy,
  mediaItemProgressMap
}: CollectionBookshelfReorderGridProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()
  const booksRef = useRef(books)
  booksRef.current = books

  const onDragend = useCallback<DragendEvent>((data) => {
    // FormKit sets drag preview z-index to 9999 but "restores" from the already-mutated
    // inline style, leaving 9999 in place — above modals (e.g. z-70). Drop inline z-index after drag.
    for (const node of data.draggedNodes) {
      const el = node.el
      if (el instanceof HTMLElement) {
        el.style.removeProperty('z-index')
      }
    }
    if (data.draggedNode.el) {
      data.draggedNode.el.classList.remove('opacity-50', 'bg-white/20')
    }
  }, [])

  const onDragstart = useCallback<DragstartEvent>((data) => {
    if (data.draggedNode.el) {
      data.draggedNode.el.classList.add('opacity-50', 'bg-white/20')
    }
  }, [])

  const [parent, sortedItems, setDragItems] = useDragAndDrop<HTMLDivElement, LibraryItem>(books, {
    dragHandle: '.drag-handle',
    ...(collectionReorderAnimationPlugins ? { plugins: collectionReorderAnimationPlugins } : {}),
    onDragend,
    onDragstart,
    handleDragend: () => {
      const next = [...sortedItems]
      const prev = booksRef.current
      setBooks(next)
      startTransition(async () => {
        try {
          await updateCollectionAction(collectionId, { books: next.map((b) => b.id) })
          router.refresh()
        } catch (error) {
          console.error('Failed to update collection order', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
          setBooks(prev)
          setDragItems(prev)
        }
      })
    }
  })

  useEffect(() => {
    setDragItems(books)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemsContentHash is order-independent; avoids resetting FormKit after pure reorder
  }, [itemsContentHash])

  const shelfEntitiesDense = useMemo(() => sortedItems as unknown as (BookshelfEntity | null)[], [sortedItems])

  return (
    <div
      ref={parent}
      className="grid w-full min-w-0 max-w-full pt-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)`,
        columnGap: `${cardMargin}px`,
        rowGap: `${(16 + dividerHeight) * sizeMultiplier}px`,
        paddingLeft: `${bookshelfMarginLeft}px`,
        paddingRight: `${bookshelfMarginLeft}px`
      }}
    >
      {sortedItems.map((book, entityIndex) => (
        <div key={book.id} className="flex justify-center overflow-visible">
          <CollectionBookCardShell
            libraryItem={book}
            cardWidth={cardWidth}
            libraryId={libraryId}
            bookshelfView={bookshelfView}
            showSubtitles={showSubtitles}
            seriesSortBy={seriesSortBy}
            mediaItemProgressMap={mediaItemProgressMap}
            shelfEntities={shelfEntitiesDense}
            entityIndex={entityIndex}
            showDragHandle
          />
        </div>
      ))}
    </div>
  )
}
