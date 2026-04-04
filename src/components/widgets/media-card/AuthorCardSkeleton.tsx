'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { mergeClasses } from '@/lib/merge-classes'
import { useId, useMemo } from 'react'

interface AuthorCardSkeletonProps {
  sizeMultiplier?: number
}

/**
 * Skeleton loading state for AuthorCard.
 * Matches the exact dimensions of the actual author card (portrait orientation, width = height * 0.8).
 */
export default function AuthorCardSkeleton({ sizeMultiplier }: AuthorCardSkeletonProps) {
  const cardId = useId()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  const coverWidth = useMemo(() => coverHeight * 0.8, [coverHeight])

  return (
    <div
      cy-id="authorCardSkeleton"
      id={cardId}
      tabIndex={0}
      aria-busy="true"
      aria-live="polite"
      className={mergeClasses('relative z-10 rounded-xs', 'focus-visible:outline-foreground-muted focus-visible:outline-1 focus-visible:outline-offset-8')}
      style={{ minWidth: `${coverWidth}px`, maxWidth: `${coverWidth}px` }}
    >
      {/* Cover skeleton with author placeholder */}
      <div
        className={mergeClasses('bg-primary box-shadow-book relative z-10 w-full overflow-hidden rounded-md', 'animate-pulse')}
        style={{ height: `${coverHeight}px` }}
        aria-hidden="true"
      >
        {/* Simulated author silhouette placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
          {/* Circle for head */}
          <div className="absolute rounded-full bg-gray-600" style={{ width: '35%', height: '28%', top: '15%' }} />
          {/* Body shape */}
          <div className="absolute rounded-t-full bg-gray-600" style={{ width: '60%', height: '35%', bottom: '0', left: '20%' }} />
        </div>

        {/* Text overlay skeleton */}
        <div className="absolute start-0 bottom-0 z-10 w-full bg-black/60 px-2 py-1">
          {/* Name skeleton */}
          <p className="mx-auto animate-pulse rounded bg-gray-600 text-[0.75em]" style={{ width: '70%' }}>
            &nbsp;
          </p>
          {/* Books count skeleton */}
          <p className="mx-auto animate-pulse rounded bg-gray-700 text-[0.65em]" style={{ width: '50%' }}>
            &nbsp;
          </p>
        </div>
      </div>
    </div>
  )
}
