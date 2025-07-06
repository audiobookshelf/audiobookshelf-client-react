import { useEffect, RefObject, useCallback } from 'react'

export function useClickOutside(
  menuRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  handler: () => void
): void {
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!menuRef.current || !triggerRef.current) return

    if (!menuRef.current.contains(event.target as Node) && !triggerRef.current.contains(event.target as Node)) {
      handler()
    }
  }, [menuRef, triggerRef, handler])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])
} 