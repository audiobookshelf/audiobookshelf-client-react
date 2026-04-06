'use client'

import MediaCardDetailView from '@/components/widgets/media-card/MediaCardDetailView'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import type { LibraryItem } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useId, useMemo } from 'react'

interface MediaCardSkeletonProps {
  bookshelfView: BookshelfView
  sizeMultiplier?: number
  showSubtitles?: boolean
  orderBy?: string
  dateFormat?: string
  timeFormat?: string
}

/**
 * Skeleton loading state for LazyLibraryItemCard.
 * Matches the exact dimensions of the actual card.
 */
export default function MediaCardSkeleton({
  bookshelfView,
  sizeMultiplier,
  showSubtitles = false,
  orderBy,
  dateFormat = 'MM/dd/yyyy',
  timeFormat = 'h:mm a'
}: MediaCardSkeletonProps) {
  const cardId = useId()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const coverAspect = useBookCoverAspectRatio()

  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const coverHeight = useMemo(() => 192 * effectiveSizeMultiplier, [effectiveSizeMultiplier])
  const coverWidth = useMemo(() => coverHeight / coverAspect, [coverHeight, coverAspect])

  const isDetailedView = bookshelfView === BookshelfView.DETAIL || bookshelfView === BookshelfView.AUTHOR

  // Mock library item for detail view
  // Include publishedYear when orderBy is media.metadata.publishedYear so skeleton renders line 3
  const mockLibraryItem = useMemo(
    () =>
      ({
        id: 'skeleton',
        libraryId: 'skeleton',
        mediaType: 'book',
        media: {
          metadata: orderBy === 'media.metadata.publishedYear' ? { publishedYear: '0000' } : {}
        },
        mtimeMs: 0,
        birthtimeMs: 0,
        addedAt: 0,
        size: 0
      }) as LibraryItem,
    [orderBy]
  )

  return (
    <div
      cy-id="mediaCard"
      id={cardId}
      tabIndex={0}
      aria-busy="true"
      aria-live="polite"
      className="focus-visible:outline-foreground-muted relative z-10 rounded-xs focus-visible:outline-1 focus-visible:outline-offset-8"
      style={{ minWidth: `${coverWidth}px`, maxWidth: `${coverWidth}px` }}
    >
      {/* Cover skeleton */}
      <div
        className="bg-primary box-shadow-book relative z-10 w-full animate-pulse overflow-hidden rounded-sm"
        style={{ height: `${coverHeight}px` }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800" />
      </div>

      {/* Detail view skeleton using actual MediaCardDetailView with isSkeleton */}
      {isDetailedView && (
        <MediaCardDetailView
          displayTitle="&nbsp;"
          displaySubtitle="&nbsp;"
          displayLineTwo="&nbsp;"
          isExplicit={false}
          showSubtitles={showSubtitles}
          orderBy={orderBy}
          libraryItem={mockLibraryItem}
          media={mockLibraryItem.media}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          // Provide mock timestamps for progress sorts so skeleton renders line 3
          lastUpdated={orderBy === 'progress' ? 1 : null}
          startedAt={orderBy === 'progress.createdAt' ? 1 : null}
          finishedAt={orderBy === 'progress.finishedAt' ? 1 : null}
          isSkeleton={true}
        />
      )}
    </div>
  )
}
