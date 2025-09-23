'use client'

import React, { useMemo, useCallback } from 'react'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { mergeClasses } from '@/lib/merge-classes'
import { DragendEvent, DragendEventData } from '@formkit/drag-and-drop'

interface SortableListProps<T> {
  items: T[]
  onSortEnd: (sortedItems: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  dragHandle?: string
  className?: string
  itemClassName?: string
  disabled?: boolean
  draggingClass?: string
  dropZoneClass?: string
}

export default function SortableList<T>({
  items,
  onSortEnd,
  renderItem,
  className = '',
  itemClassName = '',
  disabled = false,
  draggingClass = 'opacity-50 transform scale-105 shadow-lg',
  dropZoneClass = 'bg-primary/10'
}: SortableListProps<T>) {
  // Ensure each item has a unique identifier
  const itemsWithIds = items.map((item, index) => ({
    ...item,
    id: (item as any).id || `item-${index}`
  }))

  const onDragend = useCallback<DragendEvent>(
    (data: DragendEventData<any>) => {
      onSortEnd(sortedItems)
    },
    [onSortEnd]
  )

  const [parent, sortedItems] = useDragAndDrop<HTMLDivElement, T>(itemsWithIds, {
    dragHandle: '.drag-handle',
    disabled,
    draggingClass,
    dropZoneClass,
    onDragend
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
