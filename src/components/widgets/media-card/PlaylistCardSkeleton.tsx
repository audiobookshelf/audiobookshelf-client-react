'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { mergeClasses } from '@/lib/merge-classes'
import { BookshelfView } from '@/types/api'
import { useId, useMemo } from 'react'

interface PlaylistCardSkeletonProps {
  bookshelfView: BookshelfView
  bookCoverAspectRatio?: number
  sizeMultiplier?: number
}

/**
 * Skeleton loading state for PlaylistCard.
 * Matches the exact dimensions of the actual playlist card (square).
 * Displays a 2x2 grid to simulate the playlist cover layout.
 */
export default function PlaylistCardSkeleton({
  bookshelfView,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bookCoverAspectRatio = 1.6,
  sizeMultiplier
}: PlaylistCardSkeletonProps) {
  const cardId = useId()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  // Playlist card is square
  const coverWidth = useMemo(() => coverHeight, [coverHeight])

  const labelFontSize = useMemo(() => (coverWidth < 160 ? 0.75 : 0.9), [coverWidth])

  const isDetailView = bookshelfView === BookshelfView.DETAIL

  // Individual cover dimensions for 2x2 grid
  const itemWidth = coverWidth / 2
  const itemHeight = coverHeight / 2

  return (
    <div
      cy-id="playlistCardSkeleton"
      id={cardId}
      tabIndex={0}
      aria-busy="true"
      aria-live="polite"
      className={mergeClasses(
        'relative rounded-xs z-10',
        'focus-visible:outline-1 focus-visible:outline-foreground-muted focus-visible:outline-offset-8'
      )}
      style={{ minWidth: `${coverWidth}px`, maxWidth: `${coverWidth}px` }}
    >
      {/* Cover skeleton with 2x2 grid effect */}
      <div
        className={mergeClasses(
          'relative w-full rounded-sm overflow-hidden z-10 bg-primary box-shadow-book',
          'animate-pulse'
        )}
        style={{ height: `${coverHeight}px` }}
        aria-hidden="true"
      >
        {/* Simulated 2x2 grid of covers */}
        <div className="absolute inset-0 flex flex-wrap">
          {/* Top-left cover placeholder */}
          <div
            className="bg-gradient-to-br from-gray-700 to-gray-800"
            style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
          />
          {/* Top-right cover placeholder */}
          <div
            className="bg-gradient-to-br from-gray-600 to-gray-700"
            style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
          />
          {/* Bottom-left cover placeholder */}
          <div
            className="bg-gradient-to-br from-gray-600 to-gray-700"
            style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
          />
          {/* Bottom-right cover placeholder */}
          <div
            className="bg-gradient-to-br from-gray-700 to-gray-800"
            style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
          />
        </div>
      </div>

      {/* Footer skeleton - uses same structure as PlaylistCard for exact height matching */}
      {isDetailView ? (
        // Detail view footer skeleton
        <div className="relative z-30 start-0 end-0 mx-auto py-[0.25em] rounded-md text-center">
          {/* Title skeleton */}
          <p
            className="truncate rounded bg-gray-600 animate-pulse mx-auto"
            style={{ fontSize: `${labelFontSize}em`, width: '70%' }}
          >
            &nbsp;
          </p>
        </div>
      ) : (
        // Standard view footer skeleton (shiny black placard)
        <div
          className={mergeClasses(
            'categoryPlacard absolute z-10 start-0 end-0 mx-auto -bottom-[1.5em] h-[1.5em] rounded-md text-center'
          )}
          style={{ width: `${Math.min(200, coverWidth)}px` }}
        >
          <div
            className={mergeClasses(
              'w-full h-full flex items-center justify-center rounded-xs',
              'animate-pulse bg-gray-700'
            )}
            style={{ padding: '0em 0.5em' }}
          >
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

