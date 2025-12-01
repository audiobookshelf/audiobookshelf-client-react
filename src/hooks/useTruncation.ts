import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Custom hook to detect if text content is truncated using ResizeObserver.
 * More efficient than checking scrollWidth/clientWidth on every render.
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

  useEffect(() => {
    if (isSkeleton || !ref.current) {
      setIsTruncated(false)
      return
    }

    const element = ref.current

    // Check initial state
    const checkTruncation = () => {
      if (element) {
        setIsTruncated(element.scrollWidth > element.clientWidth)
      }
    }

    // Initial check
    checkTruncation()

    // Use ResizeObserver to efficiently detect size changes
    const resizeObserver = new ResizeObserver(() => {
      checkTruncation()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [content, isSkeleton])

  return { ref, isTruncated }
}
