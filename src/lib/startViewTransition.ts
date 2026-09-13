import { flushSync } from 'react-dom'

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Runs a DOM update inside a View Transition when supported (with flushSync for React). */
export function startViewTransition(update: () => void): void {
  if (prefersReducedMotion()) {
    update()
    return
  }

  const startTransition = (document as ViewTransitionDocument).startViewTransition
  if (!startTransition) {
    update()
    return
  }

  startTransition.call(document, () => {
    flushSync(update)
  })
}
