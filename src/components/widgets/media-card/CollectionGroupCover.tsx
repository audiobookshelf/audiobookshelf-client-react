'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import type { LibraryItem } from '@/types/api'
import { useMemo } from 'react'

interface CollectionGroupCoverProps {
  /** Books in the collection */
  books: LibraryItem[]
  /** Width of the cover area in pixels */
  width: number
  /** Height of the cover area in pixels */
  height: number
}

/**
 * Cover component for collections that displays up to 2 book covers side-by-side.
 * Falls back to "Empty Collection" text when no books are available.
 */
export default function CollectionGroupCover({ books, width, height }: CollectionGroupCoverProps) {
  const { sizeMultiplier } = useCardSize()
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  // No books - show empty collection message
  if (!books.length) {
    return (
      <div
        className="bg-primary relative flex h-full w-full items-center justify-center rounded-xs"
        style={{ width: `${width}px`, height: `${height}px`, padding: `${sizeMultiplier}em` }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
        <p className="z-10 text-center text-white/60" style={{ fontSize: `${Math.min(1, sizeMultiplier)}em` }}>
          Empty Collection
        </p>
      </div>
    )
  }

  // Single book - center it with empty collection background
  if (books.length === 1) {
    return (
      <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="bg-primary relative flex h-full items-center justify-center rounded-xs">
          <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
          <div className="relative z-10 h-full" style={{ width: `${width / 2}px` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getLibraryItemCoverSrc(books[0], placeholderUrl)} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    )
  }

  // Multiple books - show book covers side by side
  return (
    <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="bg-primary/95 relative flex h-full justify-center rounded-xs">
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />

        {/* First book cover */}
        <div className="relative h-full" style={{ width: `${width / 2}px` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getLibraryItemCoverSrc(books[0], placeholderUrl)} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        </div>

        {/* Second book cover */}
        <div className="relative h-full" style={{ width: `${width / 2}px` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getLibraryItemCoverSrc(books[1], placeholderUrl)} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  )
}
