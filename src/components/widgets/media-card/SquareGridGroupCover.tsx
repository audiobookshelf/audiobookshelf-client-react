'use client'

import { GroupCoverCell, GroupCoverEmptyState } from '@/components/widgets/media-card/GroupCoverParts'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useGroupCoverData } from '@/hooks/useGroupCoverData'
import type { LibraryItem } from '@/types/api'
import { useMemo } from 'react'

interface SquareGridGroupCoverProps {
  libraryItems: LibraryItem[]
  width: number
  height: number
  emptyLabel?: string
}

/**
 * Displays up to 4 library item covers in a 2x2 grid.
 * - 1 item: single centered cover
 * - 2 items: checker pattern
 * - 3+ items: first 4 in 2x2 grid (cycles if fewer than 4 unique items passed)
 */
export default function SquareGridGroupCover({ libraryItems, width, height, emptyLabel = 'Empty Playlist' }: SquareGridGroupCoverProps) {
  const { sizeMultiplier } = useCardSize()

  const itemCount = libraryItems.length

  const cellWidth = useMemo(() => {
    if (itemCount === 1) return width
    return width / 2
  }, [itemCount, width])

  const cellHeight = useMemo(() => {
    if (itemCount === 1) return height
    return height / 2
  }, [itemCount, height])

  const gridLibraryItems = useMemo(() => {
    if (!libraryItems.length) return []
    if (libraryItems.length === 1) return [libraryItems[0]]

    const covers: LibraryItem[] = []
    for (let i = 0; i < 4; i++) {
      let index = i % libraryItems.length
      if (libraryItems.length === 2 && i >= 2) {
        index = (i + 1) % 2
      }
      covers.push(libraryItems[index])
    }
    return covers
  }, [libraryItems])
  const coverData = useGroupCoverData(gridLibraryItems)

  if (!itemCount) {
    return <GroupCoverEmptyState width={width} height={height} sizeMultiplier={sizeMultiplier} label={emptyLabel} />
  }

  if (itemCount === 1) {
    return (
      <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="bg-primary relative flex h-full items-center justify-center rounded-xs">
          <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
          <GroupCoverCell cover={coverData[0]!} width={cellWidth} height={cellHeight} coverBgClassName="rounded-xs" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="bg-primary/95 relative flex h-full flex-wrap rounded-xs">
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />

        {gridLibraryItems.map((libraryItem, index) => (
          <GroupCoverCell key={`${libraryItem.id}-${index}`} cover={coverData[index]!} width={cellWidth} height={cellHeight} />
        ))}
      </div>
    </div>
  )
}
