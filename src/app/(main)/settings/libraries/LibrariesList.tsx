'use client'

import SortableList from '@/components/widgets/SortableList'
import { useState, useTransition } from 'react'
import LibrariesListRow from './LibrariesListRow'

export default function LibrariesList(props: { libraries: any[]; saveLibraryOrderAction: (reorderObjects: { id: string; newOrder: number }[]) => void }) {
  const { libraries: librariesData } = props

  const [isPending, startTransition] = useTransition()
  const [libraries, setLibraries] = useState(librariesData || ([] as any[]))

  const handleSortChange = (sortedItems: any[]) => {
    setLibraries(sortedItems as any[])
    startTransition(async () => {
      props.saveLibraryOrderAction(sortedItems.map((item, index) => ({ id: item.id, newOrder: index })))
    })
  }

  return (
    <div>
      <SortableList
        items={libraries}
        itemClassName="first:rounded-t-md last:rounded-b-md border border-border"
        disabled={isPending}
        onSortEnd={handleSortChange}
        renderItem={(item: any) => {
          return <LibrariesListRow item={item} key={item.id} />
        }}
        dragHandle=".drag-handle"
      />
    </div>
  )
}
