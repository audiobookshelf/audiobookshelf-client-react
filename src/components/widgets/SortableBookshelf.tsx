'use client'

import { ENTITY_CONFIGS } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import type { SortableBookshelfCardOptions } from '@/components/widgets/media-card/SortableBookshelfCard'
import SortableBookshelfCard from '@/components/widgets/media-card/SortableBookshelfCard'
import { getSortableBookshelfItemOrderBy } from '@/contexts/SortableBookshelfOverlayContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { ShelfNavigationEntity } from '@/lib/shelfNavigationEntity'
import type { BookshelfView, MediaProgress } from '@/types/api'
import type { SortableBookshelfEntry } from '@/types/compilation'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCodes
} from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useId, useMemo, useRef, useState, useTransition } from 'react'

const itemsConfig = ENTITY_CONFIGS.items

/** Arrow keys start keyboard reorder (with Space); Enter/Space/Tab drop; Escape cancels — matches dnd-kit defaults minus Enter on start so Enter only commits. */
const keyboardCodes: KeyboardCodes = {
  start: [KeyboardCode.Down, KeyboardCode.Up, KeyboardCode.Left, KeyboardCode.Right],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Enter, KeyboardCode.Tab]
}

export interface SortableBookshelfProps {
  entries: SortableBookshelfEntry[]
  setEntries: (next: SortableBookshelfEntry[]) => void
  onPersistOrder: (entries: SortableBookshelfEntry[]) => Promise<void>
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
  isPodcastLibrary?: boolean
  bookshelfSelectionEnabled?: boolean
  selectionScopeId?: string
  shelfSelectionEntities?: readonly (ShelfNavigationEntity | null)[]
}

/**
 * Grid-aware sortable bookshelf using dnd-kit.
 */
export default function SortableBookshelf({
  entries,
  setEntries,
  onPersistOrder,
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
  mediaItemProgressMap,
  isPodcastLibrary = false,
  bookshelfSelectionEnabled = false,
  selectionScopeId,
  shelfSelectionEntities
}: SortableBookshelfProps) {
  const dndContextId = useId()
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
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes
    })
  )

  const itemIds = useMemo(() => entries.map((e) => e.sortableId), [entries])

  const shelfEntitiesDense = useMemo(
    (): (ShelfNavigationEntity | null)[] => (shelfSelectionEntities ? [...shelfSelectionEntities] : entries.map((entry) => entry.libraryItem)),
    [entries, shelfSelectionEntities]
  )

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

      const prev = entriesRef.current
      const oldIndex = prev.findIndex((e) => e.sortableId === active.id)
      const newIndex = prev.findIndex((e) => e.sortableId === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const next = arrayMove(prev, oldIndex, newIndex)
      setEntries(next)
      startTransition(async () => {
        try {
          await onPersistOrder(next)
        } catch (error) {
          console.error('Failed to update sortable list order', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
          setEntries(prev)
        }
      })
    },
    [onPersistOrder, setEntries, showToast, t]
  )

  const activeEntry = useMemo(() => (activeId ? (entries.find((e) => e.sortableId === activeId) ?? null) : null), [activeId, entries])
  const activeIndex = useMemo(() => (activeId ? entries.findIndex((e) => e.sortableId === activeId) : -1), [activeId, entries])

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
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="grid w-full max-w-full min-w-0 pt-4" style={gridStyle}>
          {entries.map((entry, entityIndex) => (
            <SortableBookshelfCard
              key={entry.sortableId}
              {...entry}
              width={cardWidth}
              libraryId={libraryId}
              bookshelfView={bookshelfView}
              showSubtitles={showSubtitles}
              seriesSortBy={seriesSortBy}
              mediaItemProgressMap={mediaItemProgressMap}
              shelfEntities={shelfEntitiesDense}
              entityIndex={entityIndex}
              isPodcastLibrary={isPodcastLibrary}
              bookshelfSelectionEnabled={bookshelfSelectionEnabled}
              selectionScopeId={selectionScopeId}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeEntry ? (
          <div className="flex justify-center overflow-visible">
            <itemsConfig.CardComponent
              entity={activeEntry.libraryItem}
              episode={activeEntry.episode}
              bookshelfView={bookshelfView}
              width={cardWidth}
              libraryId={libraryId}
              isPodcastLibrary={isPodcastLibrary}
              showSubtitles={showSubtitles}
              orderBy={getSortableBookshelfItemOrderBy(activeEntry.libraryItem)}
              seriesSortBy={seriesSortBy}
              mediaItemProgressMap={mediaItemProgressMap}
              shelfEntities={shelfEntitiesDense}
              entityIndex={activeIndex >= 0 ? activeIndex : 0}
              sortableBookshelfCardOptions={dragOverlayCardOptions}
              bookshelfSelectionEnabled={bookshelfSelectionEnabled}
              selectionScopeId={selectionScopeId}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
