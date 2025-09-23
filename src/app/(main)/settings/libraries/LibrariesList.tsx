'use client'

import { useState } from 'react'
import SortableList from '@/components/widgets/SortableList'

export default function LibrariesList(props: { libraries: any[] }) {
  const { libraries: librariesData } = props

  const [libraries, setLibraries] = useState(librariesData || ([] as any[]))

  return (
    <div>
      <SortableList
        items={libraries}
        onSortEnd={(sortedItems: any[]) => {
          // TODO: Handle saving updated order
          setLibraries(sortedItems as any[])
          console.log('Libraries sorted', sortedItems)
        }}
        renderItem={(item: any, index: number) => {
          return (
            <div className="flex items-center gap-2 p-4">
              <div className="drag-handle">⋮⋮</div>
              {item && <div>{item.name as string}</div>}
            </div>
          )
        }}
        dragHandle=".drag-handle"
      />
    </div>
  )
}
