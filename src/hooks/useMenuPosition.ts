import { RefObject, useCallback, useLayoutEffect, useRef } from 'react'

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

const VIEWPORT_PADDING = 8
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
  const menuWidthRef = useRef<number>(0)
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
    // Use the menu's own rendered width when available so clamping is correct when the
    // menu is content-sized (icon trigger) rather than matching the trigger.
    const menuBoundingBox = menuRef.current.getBoundingClientRect()
    const menuWidth = menuBoundingBox.width || triggerBoundingBox.width
    const width = `${triggerBoundingBox.width}px`

    // Compute the horizontal position in viewport space first, clamp it so the menu never
    // extends past the right (or left) edge of the viewport, then convert to
    // portal-relative coordinates if needed.
    let viewportLeft = triggerBoundingBox.x
    const maxViewportLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - menuWidth - VIEWPORT_PADDING)
    viewportLeft = Math.min(Math.max(viewportLeft, VIEWPORT_PADDING), maxViewportLeft)
    let left: string, top: string
    if (portalContainerRef?.current) {
      const portalRect = portalContainerRef.current.getBoundingClientRect()
      // Position relative to the portal container
      left = `${viewportLeft - portalRect.left + portalContainerRef.current.scrollLeft}px`
      top = `${triggerBoundingBox.bottom - portalRect.top + portalContainerRef.current.scrollTop}px`
    } else {
      // Position relative to the window/document
      left = `${viewportLeft}px`
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
  useLayoutEffect(() => {
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

      // Set up ResizeObserver to track menu size changes
      if (menuRef.current) {
        menuObserverRef.current = new ResizeObserver((entries: ResizeObserverEntry[]) => {
          for (const entry of entries) {
            const newWidth = entry.borderBoxSize[0]?.inlineSize || entry.target.clientWidth
            const newHeight = entry.borderBoxSize[0]?.blockSize || entry.target.clientHeight
            if (newWidth !== menuWidthRef.current || newHeight !== menuHeightRef.current) {
              menuWidthRef.current = newWidth
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
