'use client'

import { mergeClasses } from '@/lib/merge-classes'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type Modifier
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'
import { ReactNode, useCallback, useMemo } from 'react'

interface SortableItem {
  id: string | number
}

/** Vertical list: ignore horizontal pointer delta so rows don’t shift sideways (avoids mobile horizontal scroll / “rubber band”). */
const restrictSortableListToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0
})

/** Attributes to spread on the drag handle (dnd-kit’s `DraggableAttributes` plus DOM props we set). */
export type SortableListDragHandleAttributes = DraggableAttributes & {
  style?: CSSProperties
  className?: string
}

export type SortableListDragHandleProps = {
  setActivatorNodeRef: (element: HTMLElement | null) => void
  attributes: SortableListDragHandleAttributes
  listeners: DraggableSyntheticListeners | undefined
}

interface SortableListProps<T extends SortableItem> {
  items: T[]
  onSortEnd: (sortedItems: T[]) => void
  renderItem: (item: T, index: number, dragHandle: SortableListDragHandleProps) => ReactNode
  className?: string
  itemClassName?: string
  disabled?: boolean
}

function SortableListRow<T extends SortableItem>({
  item,
  index,
  disabled,
  itemWrapperClassName,
  renderItem
}: {
  item: T
  index: number
  disabled: boolean
  itemWrapperClassName: string
  renderItem: (item: T, index: number, dragHandle: SortableListDragHandleProps) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
    disabled,
    // Snappier than dnd-kit defaults; avoid CSS `transition-*` on this node (see item wrapper) so
    // `transform` from the sensor isn’t eased separately from layout transitions.
    transition: {
      duration: 120,
      easing: 'ease-out'
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  // `touch-action: none` on the activator (same idea as `touch-none` on SortableBookshelfCard’s
  // handle) so coarse pointers don’t scroll the page instead of starting a drag.
  const fromKit = attributes as SortableListDragHandleAttributes
  const baseStyle = fromKit.style && typeof fromKit.style === 'object' ? { ...fromKit.style } : {}
  const activatorAttributes: SortableListDragHandleAttributes = {
    ...fromKit,
    style: {
      ...baseStyle,
      touchAction: 'none'
    }
  }
  const dragHandleProps: SortableListDragHandleProps = {
    setActivatorNodeRef,
    attributes: activatorAttributes,
    listeners
  }

  return (
    <div ref={setNodeRef} style={style} className={mergeClasses(itemWrapperClassName, isDragging && 'bg-white/20 opacity-50')}>
      {renderItem(item, index, dragHandleProps)}
    </div>
  )
}

export default function SortableList<T extends SortableItem>({
  items,
  onSortEnd,
  renderItem,
  className = '',
  itemClassName = '',
  disabled = false
}: SortableListProps<T>) {
  const itemsWithIds = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        id: item.id || `item-${index}`
      })) as T[],
    [items]
  )

  const itemWrapperClassName = mergeClasses(itemClassName)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sortableIds = useMemo(() => itemsWithIds.map((item) => String(item.id)), [itemsWithIds])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = itemsWithIds.findIndex((item) => String(item.id) === String(active.id))
      const newIndex = itemsWithIds.findIndex((item) => String(item.id) === String(over.id))
      if (oldIndex === -1 || newIndex === -1) return
      onSortEnd(arrayMove(itemsWithIds, oldIndex, newIndex))
    },
    [itemsWithIds, onSortEnd]
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictSortableListToVerticalAxis]} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className={mergeClasses('max-w-full min-w-0 overflow-x-hidden', className)}>
          {itemsWithIds.map((item, index) => (
            <SortableListRow
              key={String(item.id)}
              item={item}
              index={index}
              disabled={disabled}
              itemWrapperClassName={itemWrapperClassName}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
