import { RefObject, useCallback, useEffect, useRef } from 'react'

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
  disable?: boolean
  portalContainerRef?: RefObject<HTMLElement>
}

/**
 * Hook to calculate and manage menu positioning relative to a trigger element
 */
export const useMenuPosition = ({
  triggerRef,
  menuRef,
  isOpen,
  onPositionChange,
  disable = false,
  portalContainerRef
}: UseMenuPositionOptions): (() => void) => {
  const positionRef = useRef<MenuPosition>({} as MenuPosition)
  const menuHeightRef = useRef<number>(0)
  const triggerWidthRef = useRef<number>(0)
  const triggerHeightRef = useRef<number>(0)
  const menuObserverRef = useRef<ResizeObserver | null>(null)
  const triggerObserverRef = useRef<ResizeObserver | null>(null)
  const portalObserverRef = useRef<ResizeObserver | null>(null)

  const recalcMenuPos = useCallback(() => {
    if (disable) {
      return
    }
    if (!menuRef.current || !triggerRef.current) {
      return
    }

    const triggerBoundingBox = triggerRef.current.getBoundingClientRect()
    let left: string, top: string
    const width = `${triggerBoundingBox.width}px`

    if (portalContainerRef?.current) {
      const portalRect = portalContainerRef.current.getBoundingClientRect()
      // Position relative to the portal container
      left = `${triggerBoundingBox.left - portalRect.left + portalContainerRef.current.scrollLeft}px`
      top = `${triggerBoundingBox.bottom - portalRect.top + portalContainerRef.current.scrollTop}px`
    } else {
      // Position relative to the window/document
      left = `${triggerBoundingBox.x}px`
      top = `${triggerBoundingBox.bottom + window.scrollY}px`
    }

    // Always position below trigger for now
    const position: MenuPosition = { top, left, width }

    // Only update if position has changed
    if (position.top !== positionRef.current.top || position.left !== positionRef.current.left || position.width !== positionRef.current.width) {
      positionRef.current = position
      onPositionChange(position)
    }
  }, [onPositionChange, menuRef, triggerRef, portalContainerRef, disable])

  // Set up event listeners and ResizeObserver when menu is open
  useEffect(() => {
    if (isOpen && !disable) {
      const scrollTarget = portalContainerRef?.current || window
      const handleScroll = (event: Event): void => {
        // Check if the scroll event originated from within the menu
        if (menuRef.current && event.target && !menuRef.current.contains(event.target as Node)) {
          recalcMenuPos()
        }
      }

      window.addEventListener('resize', recalcMenuPos)
      scrollTarget.addEventListener('scroll', handleScroll, true)

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

      if (portalContainerRef?.current) {
        portalObserverRef.current = new ResizeObserver(() => {
          recalcMenuPos()
        })
        portalObserverRef.current.observe(portalContainerRef.current)
      }

      // Initial position calculation
      recalcMenuPos()

      return () => {
        window.removeEventListener('resize', recalcMenuPos)
        scrollTarget.removeEventListener('scroll', handleScroll, true)
        if (menuObserverRef.current) {
          menuObserverRef.current.disconnect()
        }
        if (triggerObserverRef.current) {
          triggerObserverRef.current.disconnect()
        }
        if (portalObserverRef.current) {
          portalObserverRef.current.disconnect()
        }
      }
    }
  }, [isOpen, recalcMenuPos, menuRef, triggerRef, portalContainerRef, disable])

  if (disable) return () => {}

  return recalcMenuPos
}
