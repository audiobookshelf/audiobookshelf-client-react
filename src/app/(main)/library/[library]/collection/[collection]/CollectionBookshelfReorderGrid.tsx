'use client'

import { updateCollectionAction } from '@/app/actions/collectionActions'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookshelfEntity, BookshelfView, LibraryItem, MediaProgress } from '@/types/api'
import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import CollectionBookCardShell from './CollectionBookCardShell'
import SortableCollectionBookCard from './SortableCollectionBookCard'

export interface CollectionBookshelfReorderGridProps {
  books: LibraryItem[]
  setBooks: (next: LibraryItem[]) => void
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
 * Grid-aware sortable bookshelf using dnd-kit.
 *
 * Why dnd-kit (and not @formkit/drag-and-drop): FormKit's synthetic-drag path uses a
 * pointer-events:none clone in the popover layer plus `document.elementFromPoint`
 * to detect the hovered card. That hover detection didn't fire reliably for cards
 * inside the scrollable bookshelf container on touch devices, so reorder never
 * happened on mobile. dnd-kit doesn't use the HTML5 drag API at all — its
 * PointerSensor + DragOverlay (portal) + rectSortingStrategy handle grids and
 * scrollable parents out of the box.
 */
export default function CollectionBookshelfReorderGrid({
  books,
  setBooks,
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
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const booksRef = useRef(books)
  booksRef.current = books

  /**
   * `distance: 8` lets a tap on the drag handle act as a tap (e.g. focusing) without
   * starting a drag — only commit to dragging once the pointer has moved 8px. This
   * also keeps clicks on overlay buttons (mark finished, more menu) working.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const itemIds = useMemo(() => books.map((b) => b.id), [books])

  const shelfEntitiesDense = useMemo(() => books as unknown as (BookshelfEntity | null)[], [books])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const prev = booksRef.current
      const oldIndex = prev.findIndex((b) => b.id === active.id)
      const newIndex = prev.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const next = arrayMove(prev, oldIndex, newIndex)
      setBooks(next)
      startTransition(async () => {
        try {
          await updateCollectionAction(collectionId, { books: next.map((b) => b.id) })
        } catch (error) {
          console.error('Failed to update collection order', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
          setBooks(prev)
        }
      })
    },
    [collectionId, setBooks, showToast, t]
  )

  const activeBook = useMemo(() => (activeId ? books.find((b) => b.id === activeId) ?? null : null), [activeId, books])
  const activeIndex = useMemo(() => (activeId ? books.findIndex((b) => b.id === activeId) : -1), [activeId, books])

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)`,
      columnGap: `${cardMargin}px`,
      rowGap: `${(16 + dividerHeight) * sizeMultiplier}px`,
      paddingLeft: `${bookshelfMarginLeft}px`,
      paddingRight: `${bookshelfMarginLeft}px`
    }),
    [bookshelfMarginLeft, cardMargin, cardWidth, columns, dividerHeight, sizeMultiplier]
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="grid w-full max-w-full min-w-0 pt-4" style={gridStyle}>
          {books.map((book, entityIndex) => (
            <SortableCollectionBookCard
              key={book.id}
              libraryItem={book}
              cardWidth={cardWidth}
              libraryId={libraryId}
              bookshelfView={bookshelfView}
              showSubtitles={showSubtitles}
              seriesSortBy={seriesSortBy}
              mediaItemProgressMap={mediaItemProgressMap}
              shelfEntities={shelfEntitiesDense}
              entityIndex={entityIndex}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeBook ? (
          <div className="flex justify-center overflow-visible">
            <CollectionBookCardShell
              libraryItem={activeBook}
              cardWidth={cardWidth}
              libraryId={libraryId}
              bookshelfView={bookshelfView}
              showSubtitles={showSubtitles}
              seriesSortBy={seriesSortBy}
              mediaItemProgressMap={mediaItemProgressMap}
              shelfEntities={shelfEntitiesDense}
              entityIndex={activeIndex}
              showDragHandle
              dragHandleAlwaysVisible
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
