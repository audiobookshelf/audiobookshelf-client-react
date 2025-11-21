'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { DragendEvent, DragstartEvent } from '@formkit/drag-and-drop'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'

interface SortableItem {
  id: string | number
}

interface SortableListProps<T extends SortableItem> {
  items: T[]
  onSortEnd: (sortedItems: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  dragHandle?: string
  className?: string
  itemClassName?: string
  disabled?: boolean
}

export default function SortableList<T extends SortableItem>({
  items,
  onSortEnd,
  renderItem,
  className = '',
  itemClassName = '',
  disabled = false
}: SortableListProps<T>) {
  // Ensure each item has a unique identifier
  const itemsWithIds = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        id: item.id || `item-${index}`
      })),
    [items]
  )

  const onDragend = useCallback<DragendEvent>((data) => {
    if (data.draggedNode.el) {
      data.draggedNode.el.classList.remove('opacity-50', 'bg-white/20')
    }
  }, [])

  const onDragstart = useCallback<DragstartEvent>((data) => {
    if (data.draggedNode.el) {
      data.draggedNode.el.classList.add('opacity-50', 'bg-white/20')
    }
  }, [])

  const [parent, sortedItems, setItems] = useDragAndDrop<HTMLDivElement, T>(itemsWithIds, {
    dragHandle: '.drag-handle',
    disabled,
    onDragend,
    onDragstart,
    handleDragend: () => onSortEnd(sortedItems)
  })

  // Reset items only when the array length changes (item added/removed), not on every render
  useEffect(() => {
    setItems(itemsWithIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsWithIds.length, setItems])

  const itemWrapperClassName = useMemo(() => {
    return mergeClasses('transition-all duration-200', itemClassName)
  }, [itemClassName])

  return (
    <div ref={parent} className={className}>
      {sortedItems.map((item: T, index: number) => (
        <div key={item.id || `item-${index}`} className={itemWrapperClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
