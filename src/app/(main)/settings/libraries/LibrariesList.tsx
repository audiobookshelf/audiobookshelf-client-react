'use client'

import SortableList from '@/components/widgets/SortableList'
import { Library } from '@/types/api'
import { useState, useTransition } from 'react'
import LibrariesListRow from './LibrariesListRow'

interface LibrariesListProps {
  libraries: Library[]
  saveLibraryOrderAction: (reorderObjects: { id: string; newOrder: number }[]) => void
}

export default function LibrariesList(props: LibrariesListProps) {
  const { libraries: librariesData, saveLibraryOrderAction } = props

  const [isPending, startTransition] = useTransition()
  const [libraries, setLibraries] = useState(librariesData || ([] as Library[]))

  const handleSortChange = (sortedItems: Library[]) => {
    setLibraries(sortedItems as Library[])
    startTransition(async () => {
      saveLibraryOrderAction(sortedItems.map((item, index) => ({ id: item.id, newOrder: index })))
    })
  }

  return (
    <div>
      <SortableList
        items={libraries}
        itemClassName="first:rounded-t-md last:rounded-b-md border border-border"
        disabled={isPending}
        onSortEnd={handleSortChange}
        renderItem={(item: Library) => {
          return <LibrariesListRow item={item} key={item.id} />
        }}
        dragHandle=".drag-handle"
      />
    </div>
  )
}
