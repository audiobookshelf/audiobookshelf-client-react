'use client'

import { useLibraryItems } from '@/contexts/LibraryItemsContext'
import { GetLibraryItemsResponse, Library } from '@/types/api'
import Link from 'next/link'
import { useEffect } from 'react'

interface BookshelfClientProps {
  library: Library
  libraryItemsData: GetLibraryItemsResponse
}

export default function BookshelfClient({ libraryItemsData }: BookshelfClientProps) {
  const { setItemCount } = useLibraryItems()

  useEffect(() => {
    // Send the item count to the toolbar
    setItemCount(libraryItemsData.total ?? 0)
  }, [libraryItemsData, setItemCount])

  const results = libraryItemsData.results

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {results.map((result) => {
          const metadata = result.media.metadata
          const authorName = 'authors' in metadata ? metadata.authors.map((a) => a.name).join(', ') : 'author' in metadata ? metadata.author : ''
          return (
            <Link
              key={result.id}
              href={`/item/${result.id}`}
              className="p-4 rounded-lg border border-border bg-primary/30 hover:bg-primary/70 cursor-pointer w-40 h-40 flex items-center justify-center flex-col text-center"
            >
              <h3 className="text-sm font-semibold mb-2">{metadata.title}</h3>
              <p className="text-sm text-gray-300">{authorName}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
