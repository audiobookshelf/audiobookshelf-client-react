import { RefObject, useCallback, useEffect, useRef } from 'react'

export function useClickOutside(menuRef: RefObject<HTMLElement | null>, triggerRef: RefObject<HTMLElement | null>, handler: () => void): void {
  const mouseDownTargetRef = useRef<EventTarget | null>(null)

  const handleMouseDown = useCallback((event: MouseEvent) => {
    mouseDownTargetRef.current = event.target
  }, [])

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!menuRef.current || !triggerRef.current) return

      // If mousedown was inside but the click ended up outside, ignore it
      // This prevents closing when dragging to select text
      if (mouseDownTargetRef.current) {
        const mouseDownTarget = mouseDownTargetRef.current as Node
        if (menuRef.current.contains(mouseDownTarget) || triggerRef.current.contains(mouseDownTarget)) {
          mouseDownTargetRef.current = null
          return
        }
      }

      if (!menuRef.current.contains(event.target as Node) && !triggerRef.current.contains(event.target as Node)) {
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
