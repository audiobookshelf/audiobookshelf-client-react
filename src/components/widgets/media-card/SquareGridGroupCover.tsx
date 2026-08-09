'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getContainedCoverDimensions, shouldShowCoverBackground, useGroupCoverData } from '@/hooks/useGroupCoverData'
import { mergeClasses } from '@/lib/merge-classes'
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
    return (
      <div
        className="bg-primary relative flex h-full w-full items-center justify-center rounded-xs"
        style={{ width: `${width}px`, height: `${height}px`, padding: `${sizeMultiplier}em` }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
        <p className="z-10 text-center text-white/60" style={{ fontSize: `${Math.min(1, sizeMultiplier)}em` }}>
          {emptyLabel}
        </p>
      </div>
    )
  }

  if (itemCount === 1) {
    const cover = coverData[0]!
    const showCoverBg = shouldShowCoverBackground(cover.imageAspectRatio, cellWidth, cellHeight)
    return (
      <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="bg-primary relative flex h-full items-center justify-center rounded-xs">
          <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
          <div className="relative z-10 flex items-center justify-center" style={{ width: `${cellWidth}px`, height: `${cellHeight}px` }}>
            {showCoverBg && (
              <div className="bg-primary absolute start-0 top-0 h-full w-full overflow-hidden rounded-xs">
                <div className="cover-bg absolute" style={{ backgroundImage: `url("${cover.coverUrl}")` }} />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.coverUrl}
              alt=""
              aria-hidden="true"
              className={mergeClasses('relative z-10', showCoverBg ? 'object-contain' : 'h-full w-full object-cover')}
              style={showCoverBg ? getContainedCoverDimensions(cellWidth, cellHeight, cover.imageAspectRatio!) : undefined}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xs" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="bg-primary/95 relative flex h-full flex-wrap rounded-xs">
        <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />

        {gridLibraryItems.map((libraryItem, index) => {
          const cover = coverData[index]!
          const showCoverBg = shouldShowCoverBackground(cover.imageAspectRatio, cellWidth, cellHeight)
          return (
            <div
              key={`${libraryItem.id}-${index}`}
              className="relative z-10 flex items-center justify-center"
              style={{ width: `${cellWidth}px`, height: `${cellHeight}px` }}
            >
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
                style={showCoverBg ? getContainedCoverDimensions(cellWidth, cellHeight, cover.imageAspectRatio!) : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
