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
