/**
 * Nearest scrollable ancestor of `element`, or `null` when nothing between the
 * element and the document scrolls. Callers that need an element either fall
 * back to `document.documentElement` (scroll math) or keep `null`
 * (IntersectionObserver `root`, where `null` already means the viewport).
 */
export function findScrollContainer(element: Element): Element | null {
  let parent = element.parentElement
  while (parent) {
    const { overflow, overflowY } = window.getComputedStyle(parent)
    if (/auto|scroll/.test(`${overflow}${overflowY}`)) return parent
    parent = parent.parentElement
  }
  return null
}

/**
 * Smooth-scroll `element` horizontally by `delta`, clamped to its scroll range.
 * iOS WebKit does not clamp smooth programmatic scrolls, so an unclamped
 * `scrollBy` past either edge leaves the content overscrolled into empty space.
 */
export function scrollHorizontallyClamped(element: HTMLElement, delta: number) {
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
  const left = Math.min(maxScrollLeft, Math.max(0, element.scrollLeft + delta))
  element.scrollTo({ left, behavior: 'smooth' })
}
