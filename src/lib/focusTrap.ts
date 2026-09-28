const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface TabTrapEvent {
  key: string
  shiftKey: boolean
  preventDefault: () => void
}

/**
 * Keep Tab inside `container`. Focus outside the container is pulled back in.
 * Shift+Tab from the container itself wraps to the last control.
 * When nothing inside is focusable, focus `fallback`, or the container.
 */
export function trapTabKey(event: TabTrapEvent, container: HTMLElement | null, fallback?: HTMLElement | null): void {
  if (event.key !== 'Tab' || !container) return

  const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (!first || !last) {
    event.preventDefault()
    ;(fallback ?? container).focus()
    return
  }

  const active = document.activeElement
  const inside = active instanceof Node && container.contains(active)

  if (!inside) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
    return
  }

  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
