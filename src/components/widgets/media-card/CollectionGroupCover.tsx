'use client'

import { GroupCoverCell } from '@/components/widgets/media-card/GroupCoverParts'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useGroupCoverData } from '@/hooks/useGroupCoverData'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
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
  const t = useTypeSafeTranslations()
  const { sizeMultiplier } = useCardSize()
  const displayedBooks = useMemo(() => books.slice(0, 2), [books])
  const coverData = useGroupCoverData(displayedBooks)
  const cellWidth = width / 2

  // No books - show empty collection message
  if (!books.length) {
    return <GroupCoverEmptyState width={width} height={height} sizeMultiplier={sizeMultiplier} label="Empty Collection" />
  }

  // Single book - center it with empty collection background
  if (books.length === 1) {
    return (
      <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="bg-primary relative flex h-full items-center justify-center rounded-xs">
          <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
          <GroupCoverCell cover={coverData[0]!} width={width} height={height} fallbackImageStyle={{ width: `${cellWidth}px`, height: '100%' }} />
        </div>
      </div>
    )
  }

  // Multiple books - show book covers side by side
  return (
    <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="bg-primary/95 relative flex h-full justify-center rounded-xs">
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />

        <GroupCoverCell cover={coverData[0]!} width={cellWidth} height={height} />
        <GroupCoverCell cover={coverData[1]!} width={cellWidth} height={height} />
      </div>
    </div>
  )
}
