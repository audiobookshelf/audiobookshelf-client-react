import { RefObject, useCallback, useEffect, useRef } from 'react'

export function useClickOutside(
  menuRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null> | null | undefined,
  handler: () => void
): void {
  const mouseDownTargetRef = useRef<EventTarget | null>(null)

  const handleMouseDown = useCallback((event: MouseEvent) => {
    mouseDownTargetRef.current = event.target
  }, [])

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!menuRef.current) return

      const clickTarget = event.target as Node
      const startTarget = mouseDownTargetRef.current as Node

      // 1. Check if the mouseup (click) is inside the modal or trigger
      const isInside = menuRef.current.contains(clickTarget) || (triggerRef?.current?.contains(clickTarget) ?? false)

      // 2. Check if the mousedown (start) was inside the modal or trigger
      const startedInside = menuRef.current.contains(startTarget) || (triggerRef?.current?.contains(startTarget) ?? false)

      // ONLY trigger handler if both the start and end of the click were truly outside
      if (!isInside && !startedInside) {
        handler()
      }

      mouseDownTargetRef.current = null
    },
    [menuRef, triggerRef, handler]
  )

  useEffect(() => {
    // Track where mousedown occurs to detect drag operations
    document.addEventListener('mousedown', handleMouseDown)

    // Use 'click' instead of 'mousedown' to ensure that interactive elements
    // (like buttons) receive their click events before the menu closes.
    // With 'mousedown', the menu close and React re-render would happen between
    // mousedown and mouseup, preventing the clicked element's onClick from firing.
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleClickOutside, handleMouseDown])
}
