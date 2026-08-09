'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getContainedCoverDimensions, shouldShowCoverBackground, useGroupCoverData } from '@/hooks/useGroupCoverData'
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
}

/**
 * Cover component for collections that displays up to 2 book covers side-by-side.
 * Falls back to "Empty Collection" text when no books are available.
 */
export default function CollectionGroupCover({ books, width, height }: CollectionGroupCoverProps) {
  const { sizeMultiplier } = useCardSize()
  const displayedBooks = useMemo(() => books.slice(0, 2), [books])
  const coverData = useGroupCoverData(displayedBooks)
  const cellWidth = width / 2

  const renderCover = (index: number, containerWidth: number = cellWidth) => {
    const cover = coverData[index]!
    const showCoverBg = shouldShowCoverBackground(cover.imageAspectRatio, containerWidth, height)
    const imageStyle = showCoverBg
      ? getContainedCoverDimensions(containerWidth, height, cover.imageAspectRatio!)
      : containerWidth > cellWidth
        ? { width: `${cellWidth}px`, height: '100%' }
        : undefined

    return (
      <div className="relative z-10 flex h-full items-center justify-center" style={{ width: `${containerWidth}px` }}>
        {showCoverBg && (
          <div className="bg-primary absolute start-0 top-0 h-full w-full overflow-hidden">
            <div className="cover-bg absolute" style={{ backgroundImage: `url("${cover.coverUrl}")` }} />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover.coverUrl}
          alt=""
          aria-hidden="true"
          className={mergeClasses('relative z-10', showCoverBg ? 'object-contain' : 'h-full w-full object-cover')}
          style={imageStyle}
        />
      </div>
    )
  }

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
          {renderCover(0, width)}
        </div>
      </div>
    )
  }

  // Multiple books - show book covers side by side
  return (
    <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="bg-primary/95 relative flex h-full justify-center rounded-xs">
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />

        {renderCover(0)}
        {renderCover(1)}
      </div>
    </div>
  )
}
