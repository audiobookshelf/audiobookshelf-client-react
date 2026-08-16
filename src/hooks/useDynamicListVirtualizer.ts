import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const OVERSCAN_ROWS = 3
const INITIAL_ROWS = 20

export interface DynamicVirtualItem {
  index: number
  start: number
}

export interface UseDynamicListVirtualizerReturn {
  virtualItems: DynamicVirtualItem[]
  totalHeight: number
  listContainerRef: (node: HTMLDivElement | null) => void
  measureElement: (index: number, node: HTMLDivElement | null) => void
}

function findScrollContainer(element: Element): Element {
  let parent = element.parentElement
  while (parent) {
    const { overflow, overflowY } = window.getComputedStyle(parent)
    if (/auto|scroll/.test(`${overflow}${overflowY}`)) return parent
    parent = parent.parentElement
  }
  return document.documentElement
}

function findFirstVisible(offsets: number[], value: number, totalItems: number) {
  let low = 0
  let high = totalItems

  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (offsets[middle + 1] <= value) low = middle + 1
    else high = middle
  }

  return low
}

function findVisibleEnd(offsets: number[], value: number, totalItems: number) {
  let low = 0
  let high = totalItems

  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (offsets[middle] < value) low = middle + 1
    else high = middle
  }

  return low
}

/**
 * Virtualizes a single-column list whose rows can have different heights.
 * Rendered rows are measured with ResizeObserver and unmeasured rows use the
 * supplied estimate until they enter the overscanned window.
 */
export function useDynamicListVirtualizer(totalItems: number, estimatedRowHeight: number): UseDynamicListVirtualizerReturn {
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)
  const listContainerRef = useCallback((node: HTMLDivElement | null) => setListElement(node), [])
  const scrollContainerRef = useRef<Element | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const rowElementsRef = useRef(new Map<number, HTMLDivElement>())
  const [rowHeights, setRowHeights] = useState(() => new Map<number, number>())
  const [visibleRange, setVisibleRange] = useState(() => ({ start: 0, end: Math.min(totalItems, INITIAL_ROWS) }))

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
    (index: number, node: HTMLDivElement | null) => {
      const previousNode = rowElementsRef.current.get(index)
      if (previousNode === node) return

      if (previousNode) resizeObserverRef.current?.unobserve(previousNode)

      if (!node) {
        rowElementsRef.current.delete(index)
        return
      }

      rowElementsRef.current.set(index, node)
      updateRowHeight(index, node.getBoundingClientRect().height)
      resizeObserverRef.current?.observe(node)
    },
    [updateRowHeight]
  )

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const index = Number((entry.target as HTMLElement).dataset.virtualIndex)
        if (Number.isInteger(index)) updateRowHeight(index, entry.target.getBoundingClientRect().height)
      }
    })

    resizeObserverRef.current = observer
    rowElementsRef.current.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
      resizeObserverRef.current = null
    }
  }, [updateRowHeight])

  const offsets = useMemo(() => {
    const nextOffsets = new Array<number>(totalItems + 1)
    nextOffsets[0] = 0
    for (let index = 0; index < totalItems; index++) {
      nextOffsets[index + 1] = nextOffsets[index] + (rowHeights.get(index) ?? estimatedRowHeight)
    }
    return nextOffsets
  }, [estimatedRowHeight, rowHeights, totalItems])

  const computeRange = useCallback(
    (scrollTop: number) => {
      if (!listElement) return

      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      const viewportHeight = scrollContainer === document.documentElement ? window.innerHeight : scrollContainer.clientHeight
      const listTop =
        scrollContainer === document.documentElement
          ? listElement.getBoundingClientRect().top + window.scrollY
          : listElement.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top + scrollTop
      const relativeScrollTop = Math.max(0, scrollTop - listTop)
      const firstVisible = findFirstVisible(offsets, relativeScrollTop, totalItems)
      const visibleEnd = findVisibleEnd(offsets, relativeScrollTop + viewportHeight, totalItems)
      const start = Math.max(0, firstVisible - OVERSCAN_ROWS)
      const end = Math.min(totalItems, visibleEnd + OVERSCAN_ROWS)

      setVisibleRange((current) => (current.start === start && current.end === end ? current : { start, end }))
    },
    [listElement, offsets, totalItems]
  )

  useEffect(() => {
    if (!listElement) return

    const scrollContainer = findScrollContainer(listElement)
    scrollContainerRef.current = scrollContainer
    const getScrollTop = () => (scrollContainer === document.documentElement ? window.scrollY : (scrollContainer as HTMLElement).scrollTop)
    const handlePositionChange = () => computeRange(getScrollTop())
    const eventTarget = scrollContainer === document.documentElement ? window : scrollContainer

    handlePositionChange()
    eventTarget.addEventListener('scroll', handlePositionChange, { passive: true })
    window.addEventListener('resize', handlePositionChange, { passive: true })

    return () => {
      eventTarget.removeEventListener('scroll', handlePositionChange)
      window.removeEventListener('resize', handlePositionChange)
      if (scrollContainerRef.current === scrollContainer) scrollContainerRef.current = null
    }
  }, [computeRange, listElement])

  const safeStart = Math.min(visibleRange.start, totalItems)
  const safeEnd = Math.min(Math.max(visibleRange.end, safeStart), totalItems)
  const virtualItems = useMemo(
    () => Array.from({ length: safeEnd - safeStart }, (_, offset) => ({ index: safeStart + offset, start: offsets[safeStart + offset] })),
    [offsets, safeEnd, safeStart]
  )

  return {
    virtualItems,
    totalHeight: offsets[totalItems] ?? 0,
    listContainerRef,
    measureElement
  }
}
