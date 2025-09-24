'use client'

import { useState } from 'react'
import Link from 'next/link'
import { mergeClasses } from '@/lib/merge-classes'
import SortableList from '@/components/widgets/SortableList'
import LibraryIcon from '@/components/ui/LibraryIcon'

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
            <div
              className={mergeClasses(
                'flex items-center gap-4 py-2 px-4 hover:bg-primary/20 text-white/50 hover:text-white border border-border',
                index === 0 ? 'rounded-t-md' : index === libraries.length - 1 ? 'rounded-b-md' : ''
              )}
            >
              <LibraryIcon icon={item.icon} />
              <Link className="text-white hover:underline" href={`/library/${item.id}`}>
                {item.name as string}
              </Link>
              <div className="grow" />
              <div className="drag-handle">
                <span className="material-symbols text-xl text-white/50 hover:text-white">reorder</span>
              </div>
            </div>
          )
        }}
        dragHandle=".drag-handle"
      />
    </div>
  )
}
