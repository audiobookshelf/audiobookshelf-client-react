'use client'

import { useCardSize } from '@/contexts/CardSizeContext'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { PlaylistItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface PlaylistGroupCoverProps {
  /** Items in the playlist */
  items: PlaylistItem[]
  /** Width of the cover area in pixels */
  width: number
  /** Height of the cover area in pixels */
  height: number
  /** Book cover aspect ratio (1 = square, 1.6 = standard) */
  bookCoverAspectRatio?: number
}

interface CoverData {
  id: string
  coverUrl: string
  showCoverBg: boolean
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
export default function PlaylistGroupCover({ items, width, height, bookCoverAspectRatio = 1 }: PlaylistGroupCoverProps) {
  const { sizeMultiplier } = useCardSize()
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])
  const [coverData, setCoverData] = useState<CoverData[]>([])
  const mountedRef = useRef(true)

  // Calculate individual cell dimensions (2x2 grid)
  const cellWidth = useMemo(() => {
    if (items.length === 1) return width
    return width / 2
  }, [items.length, width])

  const cellHeight = useMemo(() => {
    if (items.length === 1) return height
    return height / 2
  }, [items.length, height])

  // Calculate actual cover dimensions within each cell based on aspect ratio
  const itemCoverWidth = useMemo(() => {
    // For square cells, calculate cover width that fits while maintaining aspect ratio
    const fitByHeight = cellHeight / bookCoverAspectRatio
    const fitByWidth = cellWidth
    return Math.min(fitByHeight, fitByWidth)
  }, [cellWidth, cellHeight, bookCoverAspectRatio])

  const itemCoverHeight = useMemo(() => {
    return itemCoverWidth * bookCoverAspectRatio
  }, [itemCoverWidth, bookCoverAspectRatio])

  const checkImageAspectRatio = useCallback(
    (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const image = new Image()
        image.onload = () => {
          const { naturalWidth, naturalHeight } = image
          const aspectRatio = naturalHeight / naturalWidth
          const arDiff = Math.abs(aspectRatio - bookCoverAspectRatio)
          // If image aspect ratio differs by more than 0.15, show background
          resolve(arDiff > 0.15)
        }
        image.onerror = () => resolve(false)
        image.src = src
      })
    },
    [bookCoverAspectRatio]
  )

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

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Load cover data with aspect ratio checks
  useEffect(() => {
    async function loadCovers() {
      if (!libraryItemCovers.length) {
        if (mountedRef.current) {
          setCoverData([])
        }
        return
      }

      // Check aspect ratios for all covers
      const results = await Promise.all(
        libraryItemCovers.map(async (item, index) => {
          const coverUrl = getLibraryItemCoverSrc(item, placeholderUrl)
          return {
            id: `${item.id}-${index}`,
            coverUrl,
            showCoverBg: await checkImageAspectRatio(coverUrl)
          }
        })
      )

      if (mountedRef.current) {
        setCoverData(results)
      }
    }

    loadCovers()
  }, [libraryItemCovers, checkImageAspectRatio, placeholderUrl])

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

  // Single item - centered cover with correct aspect ratio
  if (items.length === 1) {
    const cover = coverData[0]
    return (
      <div className="relative rounded-xs overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
        <div className="flex items-center justify-center h-full relative bg-primary rounded-xs">
          <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />
          <div className="relative z-10 flex items-center justify-center" style={{ width: `${cellWidth}px`, height: `${cellHeight}px` }}>
            {cover?.showCoverBg && (
              <div className="absolute top-0 start-0 w-full h-full overflow-hidden rounded-xs bg-primary">
                <div className="absolute cover-bg" style={{ backgroundImage: `url("${cover.coverUrl}")` }} />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getLibraryItemCoverSrc(libraryItemCovers[0], placeholderUrl)}
              alt=""
              aria-hidden="true"
              className={mergeClasses('relative z-10', cover?.showCoverBg ? 'object-contain' : 'object-cover w-full h-full')}
              style={cover?.showCoverBg ? { width: `${itemCoverWidth}px`, height: `${itemCoverHeight}px` } : undefined}
            />
          </div>
        </div>
      </div>
    )
  }

  // Multiple items - 2x2 grid with flex wrap, each cell is square but covers maintain aspect ratio
  return (
    <div className="relative rounded-xs overflow-hidden" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="flex flex-wrap h-full relative bg-primary/95 rounded-xs">
        <div className="absolute top-0 left-0 w-full h-full bg-gray-400/5" />

        {libraryItemCovers.map((libraryItem, index) => {
          const cover = coverData[index]
          return (
            <div
              key={`${libraryItem.id}-${index}`}
              className="relative z-10 flex items-center justify-center"
              style={{ width: `${cellWidth}px`, height: `${cellHeight}px` }}
            >
              {cover?.showCoverBg && (
                <div className="absolute top-0 start-0 w-full h-full overflow-hidden bg-primary">
                  <div className="absolute cover-bg" style={{ backgroundImage: `url("${cover.coverUrl}")` }} />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getLibraryItemCoverSrc(libraryItem, placeholderUrl)}
                alt=""
                aria-hidden="true"
                className={mergeClasses('relative z-10', cover?.showCoverBg ? 'object-contain' : 'object-cover w-full h-full')}
                style={cover?.showCoverBg ? { width: `${itemCoverWidth}px`, height: `${itemCoverHeight}px` } : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
