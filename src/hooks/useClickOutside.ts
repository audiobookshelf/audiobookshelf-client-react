import { RefObject, useCallback, useEffect, useRef } from 'react'

export function useClickOutside(
  menuRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null> | null | undefined,
  handler: (event: MouseEvent) => void,
  /** Use capture phase so outside clicks are detected before bubble-phase stopPropagation on ancestors */
  useCapture = false,
  /** Additional predicate for click targets that count as inside but are not under menuRef or triggerRef */
  isAdditionalInside?: (target: Node) => boolean
): void {
  const mouseDownTargetRef = useRef<EventTarget | null>(null)

  const handleMouseDown = useCallback((event: MouseEvent) => {
    mouseDownTargetRef.current = event.target
  }, [])

  const isInsideTarget = useCallback(
    (target: Node | null | undefined) => {
      if (!target) return false
      return menuRef.current?.contains(target) || (triggerRef?.current?.contains(target) ?? false) || (isAdditionalInside?.(target) ?? false)
    },
    [menuRef, triggerRef, isAdditionalInside]
  )

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (!menuRef.current) return

      const clickTarget = event.target as Node
      const startTarget = mouseDownTargetRef.current as Node

      // ONLY trigger handler if both the start and end of the click were truly outside
      if (!isInsideTarget(clickTarget) && !isInsideTarget(startTarget)) {
        handler(event)
      }

      mouseDownTargetRef.current = null
    },
    [menuRef, isInsideTarget, handler]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown, useCapture)

    // Use 'click' instead of 'mousedown' to ensure that interactive elements
    // (like buttons) receive their click events before the menu closes.
    // With 'mousedown', the menu close and React re-render would happen between
    // mousedown and mouseup, preventing the clicked element's onClick from firing.
    document.addEventListener('click', handleClickOutside, useCapture)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, useCapture)
      document.removeEventListener('click', handleClickOutside, useCapture)
    }
  }, [handleClickOutside, handleMouseDown, useCapture])
}

/** Build an isAdditionalInside check for elements tagged with a shared data attribute (e.g. portaled dropdown submenus). */
export function createAdditionalInsideCheck(attribute: string, value: string): (target: Node) => boolean {
  return (target: Node) => target instanceof Element && !!target.closest(`[${attribute}="${value}"]`)
}
