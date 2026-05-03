'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo } from 'react'
import CollectionBookCardShell, { type CollectionBookCardShellProps } from './CollectionBookCardShell'

type SortableCollectionBookCardProps = Omit<CollectionBookCardShellProps, 'dragHandleRef' | 'dragHandleProps' | 'showDragHandle'>

/**
 * Sortable wrapper that wires dnd-kit's `useSortable` to the existing card shell.
 * The activator (drag handle) is the small `menu`-icon button inside the shell;
 * `setActivatorNodeRef` ensures dnd-kit applies its `touch-action: none` and
 * pointer listeners only there, leaving the rest of the card click/scroll friendly.
 *
 * While this item is the active drag, the in-grid slot is hidden via opacity so the
 * portal-rendered `<DragOverlay>` (in `CollectionBookshelfReorderGrid`) is the only
 * visible representation — the recommended pattern for sortable grids inside a
 * scrollable parent.
 */
export default function SortableCollectionBookCard(props: SortableCollectionBookCardProps) {
  const { libraryItem } = props
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

  return (
    <div ref={setNodeRef} style={style} className="flex justify-center overflow-visible">
      <CollectionBookCardShell {...props} showDragHandle dragHandleRef={setActivatorNodeRef} dragHandleProps={dragHandleProps} />
    </div>
  )
}
