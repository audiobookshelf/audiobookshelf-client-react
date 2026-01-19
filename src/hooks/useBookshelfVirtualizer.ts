import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseBookshelfVirtualizerProps {
  totalEntities: number
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  padding?: number
}

// Buffer of shelves to render above/below viewport
const VISIBILITY_BUFFER = 2

export function useBookshelfVirtualizer({ totalEntities, itemWidth, itemHeight, containerWidth, containerHeight, padding = 0 }: UseBookshelfVirtualizerProps) {
  // Calculate layout synchronously with useMemo - this ensures layout is immediately
  // available in the same render cycle when dimensions change
  const layout = useMemo(() => {
    if (containerWidth === 0) {
      return {
        columns: 0,
        shelfHeight: 0,
        totalShelves: 0,
        shelvesPerPage: 0
      }
    }

    const columns = Math.max(1, Math.floor((containerWidth - padding * 2) / itemWidth))
    const totalShelves = Math.ceil(totalEntities / columns)
    const shelfHeight = itemHeight
    // shelvesPerPage = visible shelves + buffer on both sides to ensure single initial fetch
    const shelvesPerPage = shelfHeight > 0 ? Math.ceil(containerHeight / shelfHeight) + VISIBILITY_BUFFER * 2 : 0

    return {
      columns,
      totalShelves,
      shelfHeight,
      shelvesPerPage
    }
  }, [containerWidth, containerHeight, totalEntities, itemWidth, itemHeight, padding])

  const [visibleRange, setVisibleRange] = useState({
    visibleShelfStart: 0,
    visibleShelfEnd: 0
  })

  const lastScrollTopRef = useRef(0)

  // Shared visibility calculation logic
  const calculateVisibleRange = useCallback(
    (scrollTop: number) => {
      const { shelfHeight, totalShelves } = layout
      if (shelfHeight === 0) return null

      const start = Math.floor(scrollTop / shelfHeight)
      const end = Math.floor((scrollTop + containerHeight) / shelfHeight)

      return {
        visibleShelfStart: Math.max(0, start - VISIBILITY_BUFFER),
        visibleShelfEnd: Math.min(totalShelves, end + VISIBILITY_BUFFER + 1)
      }
    },
    [layout, containerHeight]
  )

  // Initial/Layout-change visibility update
  useEffect(() => {
    if (layout.totalShelves === 0 || containerHeight === 0) {
      // If the shelf has collapsed (e.g. during re-measurement), we must reset the scroll tracker
      // because the browser will have reset the container scrollTop to 0.
      if (layout.shelfHeight === 0) {
        lastScrollTopRef.current = 0
      }
      return
    }

    const newRange = calculateVisibleRange(lastScrollTopRef.current)
    if (newRange) {
      setVisibleRange(newRange)
    }
  }, [layout, containerHeight, calculateVisibleRange])

  const handleScroll = useCallback(
    (scrollTop: number) => {
      if (layout.shelfHeight === 0) return

      lastScrollTopRef.current = scrollTop

      const newRange = calculateVisibleRange(scrollTop)
      if (!newRange) return

      // Only update if range actually changed
      setVisibleRange((prev) => {
        if (prev.visibleShelfStart === newRange.visibleShelfStart && prev.visibleShelfEnd === newRange.visibleShelfEnd) {
          return prev
        }
        return newRange
      })
    },
    [layout.shelfHeight, calculateVisibleRange]
  )

  return {
    ...layout,
    ...visibleRange,
    handleScroll
  }
}
