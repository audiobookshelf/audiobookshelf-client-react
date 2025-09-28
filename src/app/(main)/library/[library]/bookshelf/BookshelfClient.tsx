'use client'

import eventBus from '@/lib/eventBus'
import Link from 'next/link'
import { useEffect } from 'react'

interface BookshelfClientProps {
  library: any
  libraryItemsData: any
}

export default function BookshelfClient({ libraryItemsData }: BookshelfClientProps) {
  useEffect(() => {
    // For sending the item count to the toolbar
    eventBus.emit('itemCount', libraryItemsData.total)
  }, [libraryItemsData])

  const results = libraryItemsData.results

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {results.map((result: any) => (
          <Link
            key={result.id}
            href={`/item/${result.id}`}
            className="p-4 rounded-lg border border-border bg-primary/30 hover:bg-primary/70 cursor-pointer w-40 h-40 flex items-center justify-center flex-col text-center"
          >
            <h3 className="text-sm font-semibold mb-2">{result.media.metadata.title}</h3>
            <p className="text-sm text-gray-300">{result.media.metadata.authorName}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
