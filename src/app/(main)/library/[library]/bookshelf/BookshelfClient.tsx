'use client'

import eventBus from '@/lib/eventBus'
import { useEffect } from 'react'

interface BookshelfClientProps {
  library: any
  libraryItemsData: any
}

export default function BookshelfClient({ library, libraryItemsData }: BookshelfClientProps) {
  useEffect(() => {
    // For sending the item count to the toolbar
    eventBus.emit('itemCount', libraryItemsData.total)
  }, [libraryItemsData])

  return (
    <div>
      <div className="mb-6 p-4 bg-primary rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Items</h2>
        <div className="bg-black p-2 rounded border">
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(libraryItemsData, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
