import { useEffect } from 'react'

interface UseScrollToFocusedProps {
  /**
   * Ref to the container element that scrolls
   */
  containerRef: React.RefObject<HTMLElement | null>
  /**
   * The index of the currently focused item
   */
  focusedIndex: number
  /**
   * Function to get the target element to scroll to
   */
  getElement: (container: HTMLElement, index: number) => HTMLElement | null
  /**
   * Whether the effect should run (default: true)
   */
  active?: boolean
}

/**
 * Custom hook to scroll a focused item into view within a container
 */
export function useScrollToFocused({ containerRef, focusedIndex, getElement, active = true }: UseScrollToFocusedProps) {
  useEffect(() => {
    if (active && focusedIndex >= 0 && containerRef?.current) {
      const focusedElement = getElement(containerRef.current, focusedIndex)
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [focusedIndex, active, containerRef, getElement])
}
