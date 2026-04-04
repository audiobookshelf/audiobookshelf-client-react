'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { BookshelfView } from '@/types/api'
import { useId, useMemo } from 'react'

interface SeriesCardSkeletonProps {
  bookshelfView: BookshelfView
  bookCoverAspectRatio?: 0 | 1
  sizeMultiplier?: number
  orderBy?: string
}

/**
 * Skeleton loading state for SeriesCard.
 * Matches the exact dimensions of the actual series card (2x width of book cards).
 */
export default function SeriesCardSkeleton({ bookshelfView, bookCoverAspectRatio = 0, sizeMultiplier, orderBy }: SeriesCardSkeletonProps) {
  const cardId = useId()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const coverAspect = useMemo(() => getCoverAspectRatio(bookCoverAspectRatio), [bookCoverAspectRatio])
  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  // Series card is wider (2x width of a single book cover)
  const coverWidth = useMemo(() => (coverHeight / coverAspect) * 2, [coverHeight, coverAspect])

  const labelFontSize = useMemo(() => (coverWidth < 160 ? 0.75 : 0.9), [coverWidth])

  const isDetailView = bookshelfView === BookshelfView.DETAIL

  return (
    <div
      cy-id="seriesCardSkeleton"
      id={cardId}
      tabIndex={0}
      aria-busy="true"
      aria-live="polite"
      className="focus-visible:outline-foreground-muted relative z-30 rounded-xs focus-visible:outline-1 focus-visible:outline-offset-8"
      style={{ minWidth: `${coverWidth}px`, maxWidth: `${coverWidth}px` }}
    >
      {/* Cover skeleton with stacked book effect */}
      <div
        className="bg-primary box-shadow-book relative z-10 w-full animate-pulse overflow-hidden rounded-sm"
        style={{ height: `${coverHeight}px` }}
        aria-hidden="true"
      >
        {/* Simulated stacked book covers */}
        <div className="absolute inset-0 flex">
          {/* First book cover placeholder */}
          <div
            className="absolute top-0 h-full rounded-xs bg-gradient-to-br from-gray-700 to-gray-800"
            style={{
              width: `${coverHeight / coverAspect}px`,
              left: 0,
              zIndex: 3,
              boxShadow: '4px 0px 4px #11111166'
            }}
          />
          {/* Second book cover placeholder */}
          <div
            className="absolute top-0 h-full rounded-xs bg-gradient-to-br from-gray-600 to-gray-700"
            style={{
              width: `${coverHeight / coverAspect}px`,
              left: `${(coverWidth - coverHeight / coverAspect) / 2}px`,
              zIndex: 2,
              boxShadow: '4px 0px 4px #11111166'
            }}
          />
          {/* Third book cover placeholder */}
          <div
            className="absolute top-0 h-full rounded-xs bg-gradient-to-br from-gray-500 to-gray-600"
            style={{
              width: `${coverHeight / coverAspect}px`,
              right: 0,
              zIndex: 1
            }}
          />
        </div>

        {/* Books count badge skeleton */}
        <div
          className="shadow-modal-content absolute z-20 rounded-lg bg-gray-600"
          style={{
            top: '0.375em',
            right: '0.375em',
            padding: '0.1em 0.25em',
            width: '1.5em',
            height: '1.2em'
          }}
        />
      </div>

      {/* Footer skeleton - uses same structure as SeriesCard for exact height matching */}
      {isDetailView ? (
        // Detail view footer skeleton - matches SeriesCard's detailBottomText structure
        <div className="relative start-0 end-0 z-30 mx-auto rounded-md py-[0.25em] text-center">
          {/* Title skeleton - same structure as SeriesCard */}
          <p className="mx-auto animate-pulse truncate rounded bg-gray-600" style={{ fontSize: `${labelFontSize}em`, width: '70%' }}>
            &nbsp;
          </p>
          {/* Sort line skeleton (only when orderBy is present) */}
          {orderBy && (
            <p className="mx-auto animate-pulse truncate rounded bg-gray-700 text-gray-400" style={{ fontSize: '0.8em', width: '50%' }}>
              &nbsp;
            </p>
          )}
        </div>
      ) : (
        // Standard view footer skeleton (shiny black placard)
        <div className="categoryPlacard absolute start-0 end-0 -bottom-[1.5em] z-30 mx-auto h-[1.5em] w-[12em] rounded-md text-center">
          <div className="flex h-full w-full animate-pulse items-center justify-center rounded-xs bg-gray-700" style={{ padding: '0em 0.5em' }}>
            {/* Title text skeleton - same structure as SeriesCard */}
            <p className="truncate rounded bg-gray-600" style={{ fontSize: `${labelFontSize}em`, width: '60%' }}>
              &nbsp;
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
