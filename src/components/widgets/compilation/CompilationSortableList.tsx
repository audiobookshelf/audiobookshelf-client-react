'use client'

import SortableList, { type SortableListDragHandleProps } from '@/components/widgets/SortableList'
import { useCardSize } from '@/contexts/CardSizeContext'
import type { ReactNode } from 'react'

interface CompilationSortableListProps<TItem extends { id: string }> {
  items: TItem[]
  onSortEnd: (sortedItems: TItem[]) => void
  renderItem: (item: TItem, index: number, dragHandle: SortableListDragHandleProps) => ReactNode
  showReorder: boolean
  emptyMessage: string
}

export default function CompilationSortableList<TItem extends { id: string }>({
  items,
  onSortEnd,
  renderItem,
  showReorder,
  emptyMessage
}: CompilationSortableListProps<TItem>) {
  const { sizeMultiplier } = useCardSize()

  if (items.length === 0) {
    return (
      <div className="bg-primary/40 mt-6e w-full min-w-0" style={{ fontSize: sizeMultiplier + 'rem' }}>
        <div className="text-foreground-muted p-10e flex items-center justify-center">
          <p>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-primary/40 mt-6e w-full min-w-0" style={{ fontSize: sizeMultiplier + 'rem' }}>
      <SortableList items={items} onSortEnd={onSortEnd} renderItem={renderItem} disabled={!showReorder} className="w-full" />
    </div>
  )
}
