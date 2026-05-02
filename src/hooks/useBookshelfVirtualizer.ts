import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface UseBookshelfVirtualizerProps {
  totalEntities: number
  /** Width of one card (column track), excluding the horizontal gap after it. */
  cardWidth: number
  /** Horizontal gap between adjacent cards (`gap` in the shelf flex row). */
  columnGap: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  padding?: number
}

/**
 * Full layout record for {@link getVisibleBookshelfPageRange}. Shelf callers can use
 * {@link useBookshelfVirtualizer}'s `getVisiblePageRange(itemsPerPage, totalEntities)` instead.
 */
export type VisibleBookshelfPageRangeInput = {
  visibleShelfStart: number
  visibleShelfEnd: number
  columns: number
  itemsPerPage: number
  totalEntities: number
}

/**
 * Inclusive API page indices `[startPage, endPage]` for the visible virtual shelf window.
 * `itemsPerPage` is typically `columns * shelvesPerPage` from the same layout as the virtualizer.
 */
export function getVisibleBookshelfPageRange({ visibleShelfStart, visibleShelfEnd, columns, itemsPerPage, totalEntities }: VisibleBookshelfPageRangeInput): {
  startPage: number
  endPage: number
} {
  const itemsPerShelf = columns
  const startItem = visibleShelfStart * itemsPerShelf
  const endItem = Math.min(totalEntities, visibleShelfEnd * itemsPerShelf)

  let startPage = Math.floor(startItem / itemsPerPage)
  let endPage = Math.floor(endItem / itemsPerPage)

  // After refetch, totalEntities is 0 until the first page loads; stale visible indices can make startPage > endPage.
  if (totalEntities === 0) {
    startPage = 0
    endPage = 0
  }

  return { startPage, endPage }
}

// Buffer of shelves to render above/below viewport
const VISIBILITY_BUFFER = 2

export function useBookshelfVirtualizer({
  totalEntities,
  cardWidth,
  columnGap,
  itemHeight,
  containerWidth,
  containerHeight,
  padding = 0
}: UseBookshelfVirtualizerProps) {
  // Calculate layout synchronously with useMemo - this ensures layout is immediately
  // available in the same render cycle when dimensions change
  const layout = useMemo(() => {
    if (containerWidth === 0 || cardWidth === 0) {
      return {
        columns: 0,
        shelfHeight: 0,
        totalShelves: 0,
        shelvesPerPage: 0
      }
    }

    const availableWidth = containerWidth - padding * 2
    // We want max n columns so that n*cardWidth + (n-1)*columnGap <= availableWidth
    // so (after a little algebra): n <= (availableWidth + columnGap) / (cardWidth + columnGap)
    // Hence n = Math.floor((availableWidth + columnGap) / (cardWidth + columnGap)) or 1 if < 1
    const columns = Math.max(1, Math.floor((availableWidth + columnGap) / (cardWidth + columnGap)))
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
  }, [containerWidth, containerHeight, totalEntities, cardWidth, columnGap, itemHeight, padding])

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
      // While there are no shelves (e.g. bookshelf refetch reset total to 0), clear stale visible
      // indices. Otherwise data-loading may compute startPage > endPage and never call loadPage(0).
      if (layout.totalShelves === 0) {
        setVisibleRange({ visibleShelfStart: 0, visibleShelfEnd: 0 })
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

  const { visibleShelfStart, visibleShelfEnd } = visibleRange

  /** Maps the current visible shelf window to API list page indices (see {@link getVisibleBookshelfPageRange}). */
  const getVisiblePageRange = useCallback(
    (itemsPerPage: number, totalEntities: number) =>
      getVisibleBookshelfPageRange({
        visibleShelfStart,
        visibleShelfEnd,
        columns: layout.columns,
        itemsPerPage,
        totalEntities
      }),
    [visibleShelfStart, visibleShelfEnd, layout.columns]
  )

  return {
    ...layout,
    ...visibleRange,
    handleScroll,
    getVisiblePageRange
  }
}
