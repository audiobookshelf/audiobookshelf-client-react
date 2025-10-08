'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { DragendEvent, DragendEventData, DragstartEvent, DragstartEventData } from '@formkit/drag-and-drop'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { ReactNode, useCallback, useMemo } from 'react'

interface SortableListProps<T> {
  items: T[]
  onSortEnd: (sortedItems: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  dragHandle?: string
  className?: string
  itemClassName?: string
  disabled?: boolean
}

export default function SortableList<T>({ items, onSortEnd, renderItem, className = '', itemClassName = '', disabled = false }: SortableListProps<T>) {
  // Ensure each item has a unique identifier
  const itemsWithIds = items.map((item, index) => ({
    ...item,
    id: (item as any).id || `item-${index}`
  }))

  const onDragend = useCallback<DragendEvent>((data: DragendEventData<any>) => {
    if (data.draggedNode.el) {
      data.draggedNode.el.classList.remove('opacity-50', 'bg-white/20')
    }
  }, [])

  const onDragstart = useCallback<DragstartEvent>((data: DragstartEventData<any>) => {
    if (data.draggedNode.el) {
      data.draggedNode.el.classList.add('opacity-50', 'bg-white/20')
    }
  }, [])

  const [parent, sortedItems] = useDragAndDrop<HTMLDivElement, T>(itemsWithIds, {
    dragHandle: '.drag-handle',
    disabled,
    onDragend,
    onDragstart,
    handleDragend: () => onSortEnd(sortedItems)
  })

  const itemWrapperClassName = useMemo(() => {
    return mergeClasses('transition-all duration-200', itemClassName)
  }, [itemClassName])

  return (
    <div ref={parent} className={className}>
      {sortedItems.map((item: T, index: number) => (
        <div key={(item as any).id || `item-${index}`} className={itemWrapperClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
