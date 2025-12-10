'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { PlaylistItem } from '@/types/api'
import { useMemo } from 'react'

interface PlaylistGroupCoverProps {
  /** Items in the playlist */
  items: PlaylistItem[]
  /** Width of the cover area in pixels */
  width: number
  /** Height of the cover area in pixels */
  height: number
}

/**
 * Cover component for playlists that displays up to 4 covers in a 2x2 grid.
 * Falls back to "Empty Playlist" text when no items are available.
 *
 * Special cases:
 * - 1 item: Single centered cover
 * - 2 items: Checker pattern (alternating positions)
 * - 3+ items: First 4 items in a 2x2 grid
 */
export default function PlaylistGroupCover({ items, width, height }: PlaylistGroupCoverProps) {
  const { sizeMultiplier } = useCardSize()
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  // Calculate individual cover dimensions (2x2 grid)
  const itemCoverWidth = useMemo(() => {
    if (items.length === 1) return width
    return width / 2
  }, [items.length, width])

  const itemCoverHeight = useMemo(() => {
    if (items.length === 1) return height
    return height / 2
  }, [items.length, height])

  // Get library items for covers (up to 4)
  // For 2 items, use checker pattern like the Vue component
  const libraryItemCovers = useMemo(() => {
    if (!items.length) return []
    if (items.length === 1) return [items[0].libraryItem]

    const covers = []
    for (let i = 0; i < 4; i++) {
      let index = i % items.length
      // For playlists with 2 items show covers in checker pattern
      if (items.length === 2 && i >= 2) {
        index = (i + 1) % 2
      }
      covers.push(items[index].libraryItem)
    }
    return covers
  }, [items])

  // No items - show empty playlist message
  if (!items.length) {
    return (
      <div
        className="relative w-full h-full flex items-center justify-center bg-primary rounded-xs"
        style={{ width: `${width}px`, height: `${height}px`, padding: `${sizeMultiplier}em` }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />
        <p className="text-white/60 text-center z-10" style={{ fontSize: `${Math.min(1, sizeMultiplier)}em` }}>
          Empty Playlist
        </p>
      </div>
    )
  }

  // Single item - full-size centered cover
  if (items.length === 1) {
    return (
      <div className="relative rounded-xs overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="flex items-center justify-center h-full relative bg-primary rounded-xs">
          <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />
          <div className="relative w-full h-full z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getLibraryItemCoverSrc(libraryItemCovers[0], placeholderUrl)} alt="" aria-hidden="true" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    )
  }

  // Multiple items - 2x2 grid with flex wrap
  return (
    <div className="relative rounded-xs overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="flex flex-wrap justify-center h-full relative bg-primary/95 rounded-xs">
        <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />

        {libraryItemCovers.map((libraryItem, index) => (
          <div key={`${libraryItem.id}-${index}`} className="relative z-10" style={{ width: `${itemCoverWidth}px`, height: `${itemCoverHeight}px` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getLibraryItemCoverSrc(libraryItem, placeholderUrl)} alt="" aria-hidden="true" className={mergeClasses('w-full h-full object-cover')} />
          </div>
        ))}
      </div>
    </div>
  )
}
