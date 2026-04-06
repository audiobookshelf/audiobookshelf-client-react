'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { BookshelfView } from '@/types/api'
import { useId, useMemo } from 'react'

interface CollectionCardSkeletonProps {
  bookshelfView: BookshelfView
  sizeMultiplier?: number
}

/**
 * Skeleton loading state for CollectionCard.
 * Matches the exact dimensions of the actual collection card (2x width of book cards).
 */
export default function CollectionCardSkeleton({ bookshelfView, sizeMultiplier }: CollectionCardSkeletonProps) {
  const cardId = useId()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const coverAspect = useBookCoverAspectRatio()

  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier
  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  // Collection card is wider (2x width of a single book cover)
  const coverWidth = useMemo(() => (coverHeight / coverAspect) * 2, [coverHeight, coverAspect])

  const labelFontSize = useMemo(() => (coverWidth < 160 ? 0.75 : 0.9), [coverWidth])

  const isDetailView = bookshelfView === BookshelfView.DETAIL

  return (
    <div
      cy-id="collectionCardSkeleton"
      id={cardId}
      tabIndex={0}
      aria-busy="true"
      aria-live="polite"
      className="focus-visible:outline-foreground-muted relative z-30 rounded-xs focus-visible:outline-1 focus-visible:outline-offset-8"
      style={{ minWidth: `${coverWidth}px`, maxWidth: `${coverWidth}px` }}
    >
      {/* Cover skeleton with two book cover effect */}
      <div
        className="bg-primary box-shadow-book relative z-10 w-full animate-pulse overflow-hidden rounded-sm"
        style={{ height: `${coverHeight}px` }}
        aria-hidden="true"
      >
        {/* Simulated two book covers side by side */}
        <div className="absolute inset-0 flex">
          {/* First book cover placeholder */}
          <div className="h-full bg-gradient-to-br from-gray-700 to-gray-800" style={{ width: `${coverWidth / 2}px` }} />
          {/* Second book cover placeholder */}
          <div className="h-full bg-gradient-to-br from-gray-600 to-gray-700" style={{ width: `${coverWidth / 2}px` }} />
        </div>
      </div>

      {/* Footer skeleton - uses same structure as CollectionCard for exact height matching */}
      {isDetailView ? (
        // Detail view footer skeleton
        <div className="relative start-0 end-0 z-30 mx-auto rounded-md py-[0.25em] text-center">
          {/* Title skeleton */}
          <p className="mx-auto animate-pulse truncate rounded bg-gray-600" style={{ fontSize: `${labelFontSize}em`, width: '70%' }}>
            &nbsp;
          </p>
        </div>
      ) : (
        // Standard view footer skeleton (shiny black placard)
        <div
          className="categoryPlacard absolute start-0 end-0 -bottom-[1.5em] z-30 mx-auto h-[1.5em] rounded-md text-center"
          style={{ width: `${Math.min(200, coverWidth)}px` }}
        >
          <div className="flex h-full w-full animate-pulse items-center justify-center rounded-xs bg-gray-700" style={{ padding: '0em 0.5em' }}>
            {/* Title text skeleton */}
            <p className="truncate rounded bg-gray-600" style={{ fontSize: `${labelFontSize}em`, width: '60%' }}>
              &nbsp;
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
