import { RefObject, useCallback, useEffect } from 'react'

export function useClickOutside(menuRef: RefObject<HTMLElement | null>, triggerRef: RefObject<HTMLElement | null>, handler: () => void): void {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!menuRef.current || !triggerRef.current) return

      if (!menuRef.current.contains(event.target as Node) && !triggerRef.current.contains(event.target as Node)) {
        handler()
      }
    },
    [menuRef, triggerRef, handler]
  )

  useEffect(() => {
    // Use 'click' instead of 'mousedown' to ensure that interactive elements
    // (like buttons) receive their click events before the menu closes.
    // With 'mousedown', the menu close and React re-render would happen between
    // mousedown and mouseup, preventing the clicked element's onClick from firing.
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleClickOutside])
}
