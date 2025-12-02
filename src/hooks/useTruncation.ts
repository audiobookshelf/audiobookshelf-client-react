import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/**
 * Custom hook to detect if text content is truncated using ResizeObserver.
 *
 * @param content - The text content to check for truncation
 * @param isSkeleton - Whether the component is in skeleton/loading state
 * @returns A ref to attach to the element and a boolean indicating if content is truncated
 */
export function useTruncation<T extends HTMLElement = HTMLParagraphElement>(
  content: string,
  isSkeleton: boolean = false
): { ref: RefObject<T | null>; isTruncated: boolean } {
  const ref = useRef<T | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  const checkTruncation = useCallback(() => {
    const element = ref.current
    if (!element) return

    const truncated = element.scrollWidth > element.clientWidth
    setIsTruncated((prev) => (prev !== truncated ? truncated : prev))
  }, [])

  useLayoutEffect(() => {
    if (isSkeleton) {
      setIsTruncated(false)
      return
    }

    const element = ref.current
    if (!element) return

    // Initial check
    checkTruncation()

    // Throttled handler for ResizeObserver
    let rafId: number | null = null
    const throttledCheck = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        checkTruncation()
        rafId = null
      })
    }

    const resizeObserver = new ResizeObserver(throttledCheck)
    resizeObserver.observe(element)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [content, isSkeleton, checkTruncation])

  return { ref, isTruncated }
}
