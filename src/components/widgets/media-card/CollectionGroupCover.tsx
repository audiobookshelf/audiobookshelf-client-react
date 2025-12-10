'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import { useMemo } from 'react'

interface CollectionGroupCoverProps {
  /** Books in the collection */
  books: LibraryItem[]
  /** Width of the cover area in pixels */
  width: number
  /** Height of the cover area in pixels */
  height: number
  /** Book cover aspect ratio (1 = square, 1.6 = standard) */
  bookCoverAspectRatio: number
}

/**
 * Cover component for collections that displays up to 2 book covers side-by-side.
 * Falls back to "Empty Collection" text when no books are available.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CollectionGroupCover({ books, width, height, bookCoverAspectRatio }: CollectionGroupCoverProps) {
  const { sizeMultiplier } = useCardSize()
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  // No books - show empty collection message
  if (!books.length) {
    return (
      <div
        className="relative w-full h-full flex items-center justify-center bg-primary rounded-xs"
        style={{ width: `${width}px`, height: `${height}px`, padding: `${sizeMultiplier}em` }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />
        <p className="text-white/60 text-center z-10" style={{ fontSize: `${Math.min(1, sizeMultiplier)}em` }}>
          Empty Collection
        </p>
      </div>
    )
  }

  // Single book - center it with empty collection background
  if (books.length === 1) {
    return (
      <div className="relative rounded-xs overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="flex items-center justify-center h-full relative bg-primary rounded-xs">
          <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />
          <div className="relative h-full z-10" style={{ width: `${width / 2}px` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getLibraryItemCoverSrc(books[0], placeholderUrl)} alt="" aria-hidden="true" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    )
  }

  // Multiple books - show book covers side by side
  return (
    <div className="relative rounded-xs overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="flex justify-center h-full relative bg-primary/95 rounded-xs">
        <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />

        {/* First book cover */}
        <div className="relative h-full" style={{ width: `${width / 2}px` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getLibraryItemCoverSrc(books[0], placeholderUrl)} alt="" aria-hidden="true" className={mergeClasses('w-full h-full object-cover')} />
        </div>

        {/* Second book cover */}
        <div className="relative h-full" style={{ width: `${width / 2}px` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getLibraryItemCoverSrc(books[1], placeholderUrl)} alt="" aria-hidden="true" className={mergeClasses('w-full h-full object-cover')} />
        </div>
      </div>
    </div>
  )
}
