'use client'

import { ENTITY_CONFIGS, type CardComponentProps } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { getSortableBookshelfItemOrderBy, type SortableBookshelfOverlayMode } from '@/contexts/SortableBookshelfContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { LibraryItem } from '@/types/api'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, type Ref } from 'react'

const itemsConfig = ENTITY_CONFIGS.items

/**
 * Options passed from sortable bookshelf hosts into the shared items card: dnd-kit drag activator
 * wiring and optional per-card overlay mode (e.g. `DragOverlay` preview vs in-grid card).
 */
export interface SortableBookshelfCardOptions {
  ariaLabel: string
  activatorRef?: Ref<HTMLDivElement>
  /** @dnd-kit `attributes` + `listeners`; loose record for clean merging onto the drag wrapper `div`. */
  activatorProps?: Record<string, unknown>
  /**
   * When set (e.g. `drag` on the dnd-kit `DragOverlay` card), overrides shelf context `overlayMode`
   * for overlay chrome and card navigation on this card only.
   */
  overlayMode?: SortableBookshelfOverlayMode
}

type SortableBookshelfCardProps = Omit<CardComponentProps, 'entity'> & {
  libraryItem: LibraryItem
}

/**
 * Sortable wrapper that wires dnd-kit's `useSortable` to the standard items card.
 * The drag handle uses DraggableMediaOverlayIconBtn with setActivatorNodeRef so dnd-kit
 * applies `touch-action: none` and pointer listeners only there, leaving the rest of
 * the card click/scroll friendly.
 *
 * While this item is the active drag, the in-grid slot is hidden via opacity so the
 * portal-rendered `<DragOverlay>` is the only visible representation — the recommended
 * pattern for sortable grids inside a scrollable parent.
 */
export default function SortableBookshelfCard({ libraryItem, ...cardProps }: SortableBookshelfCardProps) {
  const t = useTypeSafeTranslations()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: libraryItem.id })

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : 1
    }),
    [transform, transition, isDragging]
  )

  const dragHandleProps = useMemo(() => ({ ...attributes, ...listeners }), [attributes, listeners])

  const orderBy = useMemo(() => getSortableBookshelfItemOrderBy(libraryItem), [libraryItem])

  const sortableBookshelfCardOptions = useMemo(
    (): SortableBookshelfCardOptions => ({
      ariaLabel: t('TooltipCollectionDragHandle'),
      activatorRef: setActivatorNodeRef,
      activatorProps: dragHandleProps
    }),
    [t, setActivatorNodeRef, dragHandleProps]
  )

  return (
    <div ref={setNodeRef} style={style} className="flex justify-center overflow-visible">
      <itemsConfig.CardComponent
        {...cardProps}
        entity={libraryItem}
        orderBy={orderBy}
        isPodcastLibrary={false}
        sortableBookshelfCardOptions={sortableBookshelfCardOptions}
      />
    </div>
  )
}
