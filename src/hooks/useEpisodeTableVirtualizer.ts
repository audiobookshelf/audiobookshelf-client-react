import { useCallback, useEffect, useRef, useState } from 'react'

/** Number of rows to render above and below the visible window */
const BUFFER_ROWS = 3

/**
 * Fallback number of rows to render before layout is calculated.
 * Must be large enough that the viewport is filled.
 */
const INITIAL_ROWS = 20

export interface UseEpisodeTableVirtualizerReturn {
  /** Index of the first episode row to render (inclusive) */
  visibleStart: number
  /** Index of the last episode row to render (exclusive) */
  visibleEnd: number
  /** Total scrollable height of the episodes list in pixels */
  totalHeight: number
  /** Ref to attach to the outer episodes list container div */
  listContainerRef: (node: HTMLDivElement | null) => void
}

/**
 * Lightweight single-column virtualizer for the episode table.
 *
 * Strategy:
 * - Uses a fixed row height to avoid ResizeObserver delays and reflows.
 * - A scroll listener on the nearest scrollable ancestor of `listContainerRef`
 *   computes which rows are inside the viewport (plus buffer).
 * - `visibleStart`/`visibleEnd` are exposed so the consumer renders only
 *   those rows, positioned absolutely inside a fixed-height container.
 */
export function useEpisodeTableVirtualizer(totalItems: number, rowHeight: number): UseEpisodeTableVirtualizerReturn {
  const [listEl, setListEl] = useState<HTMLDivElement | null>(null)
  const listContainerRef = useCallback((node: HTMLDivElement | null) => {
    setListEl(node)
  }, [])
  const scrollContainerRef = useRef<Element | null>(null)

  const [visibleStart, setVisibleStart] = useState(0)
  const [visibleEnd, setVisibleEnd] = useState(INITIAL_ROWS)

  const totalHeight = totalItems * rowHeight

  // ── Compute visible range from a given scrollTop ──────────────────────────
  const computeRange = useCallback(
    (scrollTop: number) => {
      if (!listEl) return

      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      // Height of the viewport (scroll container)
      const viewportHeight = scrollContainer === document.documentElement ? window.innerHeight : scrollContainer.clientHeight

      // Top position of the list container relative to the scroll container
      let listTop = 0
      if (scrollContainer === document.documentElement) {
        listTop = listEl.getBoundingClientRect().top + window.scrollY
      } else {
        listTop = listEl.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollTop
      }

      // How far the scroll position is past the top of the list
      const relativeScrollTop = Math.max(0, scrollTop - listTop)

      const rawStart = Math.floor(relativeScrollTop / rowHeight)
      const rawEnd = Math.ceil((relativeScrollTop + viewportHeight) / rowHeight)

      const start = Math.max(0, rawStart - BUFFER_ROWS)
      const end = Math.min(totalItems, rawEnd + BUFFER_ROWS)

      setVisibleStart(start)
      setVisibleEnd(end)
    },
    [totalItems, rowHeight, listEl]
  )

  // ── Scroll listener (also finds scroll container lazily) ──────────────────
  useEffect(() => {
    if (!listEl) return // list container is not rendered yet

    let scrollEl = scrollContainerRef.current
    if (!scrollEl) {
      let parent = listEl.parentElement
      while (parent) {
        const style = window.getComputedStyle(parent)
        const overflow = style.overflow + style.overflowY
        if (/auto|scroll/.test(overflow)) {
          scrollEl = parent
          break
        }
        parent = parent.parentElement
      }

      // Fallback to page-level scroll if no scrollable ancestor found
      if (!scrollEl) {
        scrollEl = document.documentElement
      }
      scrollContainerRef.current = scrollEl
    }

    const getScrollTop = () => (scrollEl === document.documentElement ? window.scrollY : (scrollEl as HTMLElement).scrollTop)

    const onScroll = () => computeRange(getScrollTop())

    // Compute immediately so the correct range is applied right off the bat
    computeRange(getScrollTop())

    const target = scrollEl === document.documentElement ? window : scrollEl
    target.addEventListener('scroll', onScroll, { passive: true })
    if (target === window) {
      window.addEventListener('resize', onScroll, { passive: true })
    }

    return () => {
      target.removeEventListener('scroll', onScroll)
      if (target === window) {
        window.removeEventListener('resize', onScroll)
      }
    }
  }, [computeRange, listEl])

  return {
    visibleStart,
    visibleEnd,
    totalHeight,
    listContainerRef
  }
}
