import { findScrollContainer } from '@/lib/scrollContainer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Number of rows to render above and below the visible window */
const OVERSCAN_ROWS = 3

/** Ignore sub-layout width noise such as scrollbar gutters */
const WIDTH_CHANGE_PX = 24

/**
 * Fallback number of rows to render before layout is calculated.
 * Must be large enough that the viewport is filled.
 */
const INITIAL_ROWS = 20

export interface VirtualListItem {
  index: number
  /** Offset of the row from the top of the list container, in pixels */
  start: number
}

export interface UseListVirtualizerReturn {
  /** Rows to render, in index order, each positioned at its own `start` offset */
  virtualItems: VirtualListItem[]
  /** Total scrollable height of the list in pixels */
  totalHeight: number
  /** Ref to attach to the outer list container div */
  listContainerRef: (node: HTMLDivElement | null) => void
  /**
   * Ref callback for a rendered row. Wiring this opts the list into measured
   * variable row heights; lists whose rows are a truly fixed height can ignore
   * it and every row keeps the `rowHeight` passed to the hook.
   */
  measureElement: (index: number, node: HTMLElement | null) => void
}

/**
 * Row geometry for the current set of measurements. Keeping the two strategies
 * behind one interface means the range and offset math below never branches:
 * unmeasured lists stay pure arithmetic instead of materializing offsets.
 */
interface ListLayout {
  totalItems: number
  totalHeight: number
  /** Offset of row `index` from the top of the list */
  offsetAt: (index: number) => number
  /** First row whose bottom edge is past `scrollTop` */
  firstVisibleAt: (scrollTop: number) => number
  /** Exclusive index of the first row starting at or after `scrollBottom` */
  visibleEndAt: (scrollBottom: number) => number
}

function uniformLayout(totalItems: number, rowHeight: number): ListLayout {
  const clamp = (index: number) => Math.min(Math.max(index, 0), totalItems)

  return {
    totalItems,
    totalHeight: totalItems * rowHeight,
    offsetAt: (index) => index * rowHeight,
    firstVisibleAt: (scrollTop) => clamp(Math.floor(scrollTop / rowHeight)),
    visibleEndAt: (scrollBottom) => clamp(Math.ceil(scrollBottom / rowHeight))
  }
}

function measuredLayout(totalItems: number, rowHeight: number, rowHeights: Map<number, number>): ListLayout {
  const offsets = new Array<number>(totalItems + 1)
  offsets[0] = 0
  for (let index = 0; index < totalItems; index++) {
    offsets[index + 1] = offsets[index] + (rowHeights.get(index) ?? rowHeight)
  }

  return {
    totalItems,
    totalHeight: offsets[totalItems],
    offsetAt: (index) => offsets[index],
    firstVisibleAt: (scrollTop) => {
      let low = 0
      let high = totalItems

      while (low < high) {
        const middle = Math.floor((low + high) / 2)
        if (offsets[middle + 1] <= scrollTop) low = middle + 1
        else high = middle
      }

      return low
    },
    visibleEndAt: (scrollBottom) => {
      let low = 0
      let high = totalItems

      while (low < high) {
        const middle = Math.floor((low + high) / 2)
        if (offsets[middle] < scrollBottom) low = middle + 1
        else high = middle
      }

      return low
    }
  }
}

/**
 * Lightweight single-column virtualizer.
 *
 * Strategy:
 * - A scroll listener on the nearest scrollable ancestor of `listContainerRef`
 *   computes which rows are inside the viewport (plus overscan).
 * - `virtualItems` is exposed so the consumer renders only those rows,
 *   positioned absolutely inside a `totalHeight` container.
 * - `rowHeight` is the exact height for fixed-height lists and the estimate for
 *   rows the consumer measures through `measureElement`. Measured heights are
 *   remembered after a row unmounts, so offsets stay stable while scrolling back.
 */
export function useListVirtualizer(totalItems: number, rowHeight: number): UseListVirtualizerReturn {
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)
  const listElementRef = useRef<HTMLDivElement | null>(null)
  const listContainerRef = useCallback((node: HTMLDivElement | null) => {
    listElementRef.current = node
    setListElement(node)
  }, [])

  const scrollContainerRef = useRef<Element | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const rowNodesRef = useRef(new Map<number, HTMLElement>())
  const rowIndexesRef = useRef(new WeakMap<Element, number>())
  const [rowHeights, setRowHeights] = useState(() => new Map<number, number>())
  const lastContainerWidthRef = useRef<number | null>(null)
  const [visibleRange, setVisibleRange] = useState(() => ({ start: 0, end: Math.min(totalItems, INITIAL_ROWS) }))

  const layout = useMemo(
    () => (rowHeights.size ? measuredLayout(totalItems, rowHeight, rowHeights) : uniformLayout(totalItems, rowHeight)),
    [rowHeight, rowHeights, totalItems]
  )
  const layoutRef = useRef(layout)

  const updateRowHeight = useCallback((index: number, height: number) => {
    if (height <= 0) return
    setRowHeights((current) => {
      if (Math.abs((current.get(index) ?? 0) - height) < 0.5) return current
      const next = new Map(current)
      next.set(index, height)
      return next
    })
  }, [])

  const measureElement = useCallback(
    (index: number, node: HTMLElement | null) => {
      const previousNode = rowNodesRef.current.get(index)
      if (previousNode === node) return

      if (previousNode) {
        resizeObserverRef.current?.unobserve(previousNode)
        rowIndexesRef.current.delete(previousNode)
      }

      if (!node) {
        rowNodesRef.current.delete(index)
        return
      }

      rowNodesRef.current.set(index, node)
      rowIndexesRef.current.set(node, index)
      updateRowHeight(index, node.getBoundingClientRect().height)
      resizeObserverRef.current?.observe(node)
    },
    [updateRowHeight]
  )

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const index = rowIndexesRef.current.get(entry.target)
        if (index !== undefined) updateRowHeight(index, entry.target.getBoundingClientRect().height)
      }
    })

    resizeObserverRef.current = observer
    // Rows mounted before this effect ran are already registered, so observe them now
    rowNodesRef.current.forEach((node) => observer.observe(node))

    return () => {
      observer.disconnect()
      resizeObserverRef.current = null
    }
  }, [updateRowHeight])

  // Reads geometry through refs so row measurements must not resubscribe the scroll listener or re-walk the ancestors for a scroll container.
  const computeRange = useCallback(() => {
    const listEl = listElementRef.current
    const scrollContainer = scrollContainerRef.current
    if (!listEl || !scrollContainer) return

    const currentLayout = layoutRef.current
    const isDocumentScroll = scrollContainer === document.documentElement

    // Height of the viewport (scroll container)
    const viewportHeight = isDocumentScroll ? window.innerHeight : scrollContainer.clientHeight
    const scrollTop = isDocumentScroll ? window.scrollY : (scrollContainer as HTMLElement).scrollTop

    // Top position of the list container relative to the scroll container
    const listTop = isDocumentScroll
      ? listEl.getBoundingClientRect().top + window.scrollY
      : listEl.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollTop

    // How far the scroll position is past the top of the list
    const relativeScrollTop = Math.max(0, scrollTop - listTop)

    const start = Math.max(0, currentLayout.firstVisibleAt(relativeScrollTop) - OVERSCAN_ROWS)
    const end = Math.min(currentLayout.totalItems, currentLayout.visibleEndAt(relativeScrollTop + viewportHeight) + OVERSCAN_ROWS)

    setVisibleRange((current) => (current.start === start && current.end === end ? current : { start, end }))
  }, [])

  useEffect(() => {
    if (!listElement) return // list container is not rendered yet

    // Fall back to page-level scroll if no scrollable ancestor found
    const scrollContainer = findScrollContainer(listElement) ?? document.documentElement
    scrollContainerRef.current = scrollContainer
    const eventTarget = scrollContainer === document.documentElement ? window : scrollContainer

    // Compute immediately so the correct range is applied right off the bat
    computeRange()
    eventTarget.addEventListener('scroll', computeRange, { passive: true })
    // A container-sized viewport still changes height with the window
    window.addEventListener('resize', computeRange, { passive: true })

    // If the list width changes, clear stale heights for rows that are no longer
    // mounted; they'll be re-measured on remount.
    lastContainerWidthRef.current = listElement.clientWidth
    let widthRaf = 0
    const listWidthObserver = new ResizeObserver(() => {
      const newWidth = listElement.clientWidth
      const previousWidth = lastContainerWidthRef.current
      if (previousWidth != null && Math.abs(newWidth - previousWidth) < WIDTH_CHANGE_PX) return
      lastContainerWidthRef.current = newWidth
      if (previousWidth == null) return

      cancelAnimationFrame(widthRaf)
      widthRaf = requestAnimationFrame(() => {
        setRowHeights((current) => {
          if (!current.size) return current
          // Skip while rows are remounting so a width tick cannot wipe the cache.
          const mounted = rowNodesRef.current
          if (!mounted.size) return current
          // Keep entries for mounted rows; the per-row observer will update them.
          const next = new Map<number, number>()
          for (const [index, height] of current) {
            if (mounted.has(index)) next.set(index, height)
          }
          return next.size === current.size ? current : next
        })
      })
    })
    listWidthObserver.observe(listElement)

    return () => {
      eventTarget.removeEventListener('scroll', computeRange)
      window.removeEventListener('resize', computeRange)
      cancelAnimationFrame(widthRaf)
      listWidthObserver.disconnect()
      scrollContainerRef.current = null
    }
  }, [computeRange, listElement])

  useEffect(() => {
    layoutRef.current = layout
    computeRange()
  }, [computeRange, layout])

  const rangeStart = Math.min(visibleRange.start, totalItems)
  const rangeEnd = Math.min(Math.max(visibleRange.end, rangeStart), totalItems)
  const virtualItems = useMemo(
    () => Array.from({ length: rangeEnd - rangeStart }, (_, offset) => ({ index: rangeStart + offset, start: layout.offsetAt(rangeStart + offset) })),
    [layout, rangeEnd, rangeStart]
  )

  return {
    virtualItems,
    totalHeight: layout.totalHeight,
    listContainerRef,
    measureElement
  }
}
