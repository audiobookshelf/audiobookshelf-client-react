import { useCallback, useRef, useEffect, RefObject } from 'react'

interface MenuPosition {
  top: string
  left: string
  width: string
}

interface UseMenuPositionOptions {
  triggerRef: RefObject<HTMLElement>
  menuRef: RefObject<HTMLElement>
  isOpen: boolean
  onPositionChange: (position: MenuPosition) => void
  onClose?: () => void
  disable?: boolean
}

/**
 * Hook to calculate and manage menu positioning relative to a trigger element
 */
export const useMenuPosition = ({ triggerRef, menuRef, isOpen, onPositionChange, onClose, disable = false }: UseMenuPositionOptions): (() => void) => {
  if (disable) return () => {}

  const positionRef = useRef<MenuPosition>({} as MenuPosition)
  const menuHeightRef = useRef<number>(0)
  const triggerWidthRef = useRef<number>(0)
  const triggerHeightRef = useRef<number>(0)
  const menuObserverRef = useRef<ResizeObserver | null>(null)
  const triggerObserverRef = useRef<ResizeObserver | null>(null)

  const recalcMenuPos = useCallback(
    (event?: Event) => {
      if (!menuRef.current || !triggerRef.current) {
        return
      }

      const triggerBoundingBox = triggerRef.current.getBoundingClientRect()

      const left = `${triggerBoundingBox.x}px`
      const width = `${triggerBoundingBox.width}px`
      const top = `${triggerBoundingBox.bottom + window.scrollY}px`

      // Always position below trigger for now
      const position: MenuPosition = { top, left, width }

      // Only update if position has changed
      if (position.top !== positionRef.current.top || position.left !== positionRef.current.left || position.width !== positionRef.current.width) {
        positionRef.current = position
        onPositionChange(position)
      }
    },
    [onPositionChange, onClose, menuRef, triggerRef]
  )

  // Set up event listeners and ResizeObserver when menu is open
  useEffect(() => {
    if (isOpen) {
      const handleScroll = (event: Event): void => {
        // Check if the scroll event originated from within the menu
        if (menuRef.current && event.target && !menuRef.current.contains(event.target as Node)) {
          recalcMenuPos(event)
        }
      }

      window.addEventListener('resize', recalcMenuPos)
      window.addEventListener('scroll', handleScroll, true)

      // Set up ResizeObserver to track menu height changes
      if (menuRef.current) {
        menuObserverRef.current = new ResizeObserver((entries: ResizeObserverEntry[]) => {
          for (const entry of entries) {
            const newHeight = entry.borderBoxSize[0]?.blockSize || entry.target.clientHeight
            if (newHeight !== menuHeightRef.current) {
              menuHeightRef.current = newHeight
              recalcMenuPos()
            }
          }
        })
        menuObserverRef.current.observe(menuRef.current)
      }

      if (triggerRef.current) {
        triggerObserverRef.current = new ResizeObserver((entries: ResizeObserverEntry[]) => {
          for (const entry of entries) {
            const newWidth = entry.borderBoxSize[0]?.inlineSize || entry.target.clientWidth
            const newHeight = entry.borderBoxSize[0]?.blockSize || entry.target.clientHeight

            // Check if either width or height changed
            if (newWidth !== triggerWidthRef.current || newHeight !== triggerHeightRef.current) {
              triggerWidthRef.current = newWidth
              triggerHeightRef.current = newHeight
              recalcMenuPos()
            }
          }
        })
        triggerObserverRef.current.observe(triggerRef.current)
      }

      // Initial position calculation
      recalcMenuPos()

      return () => {
        window.removeEventListener('resize', recalcMenuPos)
        window.removeEventListener('scroll', handleScroll, true)
        if (menuObserverRef.current) {
          menuObserverRef.current.disconnect()
        }
        if (triggerObserverRef.current) {
          triggerObserverRef.current.disconnect()
        }
      }
    }
  }, [isOpen, recalcMenuPos, menuRef, triggerRef])

  return recalcMenuPos
}
