'use client'

import { useState } from 'react'
import SortableList from '@/components/widgets/SortableList'
import LibrariesListRow from './LibrariesListRow'

export default function LibrariesList(props: { libraries: any[] }) {
  const { libraries: librariesData } = props

  const [libraries, setLibraries] = useState(librariesData || ([] as any[]))

  return (
    <div>
      <SortableList
        items={libraries}
        itemClassName="first:rounded-t-md last:rounded-b-md border border-border"
        onSortEnd={(sortedItems: any[]) => {
          setLibraries(sortedItems as any[])
          console.log('Libraries sorted', sortedItems)
        }}
        renderItem={(item: any) => {
          return <LibrariesListRow item={item} key={item.id} />
        }}
        dragHandle=".drag-handle"
      />
    </div>
  )
}
