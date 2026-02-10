import { useCallback, useEffect, useRef } from 'react'

interface UsePersistentScrollProps {
  scrollKey: string
  containerRef: React.RefObject<HTMLDivElement | null>
  isEnabled: boolean
}

export function usePersistentScroll({ scrollKey, containerRef, isEnabled }: UsePersistentScrollProps) {
  // Track if we have already restored scroll for this view instance
  const hasRestoredScrollRef = useRef(false)
  // Track the previous key to detect changes
  const prevKeyRef = useRef(scrollKey)
  // Scroll debounce timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Handle Reset on Key Change (Sort/Filter etc)
  useEffect(() => {
    // Only run if key actually changed (skip on mount)
    if (prevKeyRef.current !== scrollKey) {
      prevKeyRef.current = scrollKey
      hasRestoredScrollRef.current = false

      // Clear the storage for this new key and reset visually
      sessionStorage.removeItem(scrollKey)
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    }
  }, [scrollKey, containerRef])

  // 2. Restore Logic
  useEffect(() => {
    if (hasRestoredScrollRef.current || !isEnabled || !containerRef.current) return

    // Mark as restored so we don't try again
    hasRestoredScrollRef.current = true

    const savedScroll = sessionStorage.getItem(scrollKey)
    if (savedScroll) {
      const scrollTop = parseInt(savedScroll, 10)
      if (!isNaN(scrollTop)) {
        containerRef.current.scrollTop = scrollTop
      }
    }
  }, [scrollKey, isEnabled, containerRef])

  // 3. Save Handler
  const handleScroll = useCallback(
    (scrollTop: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        sessionStorage.setItem(scrollKey, scrollTop.toString())
      }, 100)
    },
    [scrollKey]
  )

  return { handleScroll, saveTimeoutRef }
}
