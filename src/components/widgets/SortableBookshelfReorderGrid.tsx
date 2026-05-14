'use client'

import { ENTITY_CONFIGS } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { updateCollectionAction } from '@/app/actions/collectionActions'
import type { SortableBookshelfCardOptions } from '@/components/widgets/media-card/SortableBookshelfCard'
import { getSortableBookshelfItemOrderBy } from '@/contexts/SortableBookshelfContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookshelfEntity, BookshelfView, LibraryItem, MediaProgress } from '@/types/api'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import SortableBookshelfCard from './media-card/SortableBookshelfCard'

const itemsConfig = ENTITY_CONFIGS.items

export interface SortableBookshelfReorderGridProps {
  items: LibraryItem[]
  setItems: (next: LibraryItem[]) => void
  /** Target id for persisting order (e.g. collection id when using {@link updateCollectionAction}). */
  sortableListId: string
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
export default function SortableBookshelfReorderGrid({
  items,
  setItems,
  sortableListId,
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
}: SortableBookshelfReorderGridProps) {
  const t = useTypeSafeTranslations()
  const dragOverlayCardOptions = useMemo(
    (): SortableBookshelfCardOptions => ({
      ariaLabel: t('TooltipCollectionDragHandle'),
      overlayMode: 'drag'
    }),
    [t]
  )
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  /**
   * `distance: 8` lets a tap on the drag handle act as a tap (e.g. focusing) without
   * starting a drag — only commit to dragging once the pointer has moved 8px. This
   * also keeps clicks on overlay buttons (mark finished, more menu) working.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const itemIds = useMemo(() => items.map((b) => b.id), [items])

  const shelfEntitiesDense = useMemo(() => items as unknown as (BookshelfEntity | null)[], [items])

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

      const prev = itemsRef.current
      const oldIndex = prev.findIndex((b) => b.id === active.id)
      const newIndex = prev.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const next = arrayMove(prev, oldIndex, newIndex)
      setItems(next)
      startTransition(async () => {
        try {
          await updateCollectionAction(sortableListId, { books: next.map((b) => b.id) })
        } catch (error) {
          console.error('Failed to update collection order', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
          setItems(prev)
        }
      })
    },
    [sortableListId, setItems, showToast, t]
  )

  const activeItem = useMemo(() => (activeId ? (items.find((b) => b.id === activeId) ?? null) : null), [activeId, items])
  const activeIndex = useMemo(() => (activeId ? items.findIndex((b) => b.id === activeId) : -1), [activeId, items])

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
          {items.map((item, entityIndex) => (
            <SortableBookshelfCard
              key={item.id}
              libraryItem={item}
              width={cardWidth}
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
        {activeItem ? (
          <div className="flex justify-center overflow-visible">
            <itemsConfig.CardComponent
              entity={activeItem}
              bookshelfView={bookshelfView}
              width={cardWidth}
              libraryId={libraryId}
              isPodcastLibrary={false}
              showSubtitles={showSubtitles}
              orderBy={getSortableBookshelfItemOrderBy(activeItem)}
              seriesSortBy={seriesSortBy}
              mediaItemProgressMap={mediaItemProgressMap}
              shelfEntities={shelfEntitiesDense}
              entityIndex={activeIndex >= 0 ? activeIndex : 0}
              sortableBookshelfCardOptions={dragOverlayCardOptions}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
