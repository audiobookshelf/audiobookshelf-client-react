'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Marks every top-level sibling of `overlayRef` as `inert` while it is mounted, so the page
 * behind an overlay cannot be reached by Tab, screen readers or clicks.
 *
 * Elements portalled to `document.body` *after* this runs — popovers, tooltips and modals
 * opened from inside the overlay — are deliberately left alone, which is what a plain focus
 * trap gets wrong: those live outside the overlay's DOM subtree but belong to it.
 *
 * The overlay itself must therefore be a direct child of `document.body`; a nested overlay
 * cannot be excluded from an inert ancestor.
 */
export function useInertBackground(overlayRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const madeInert: HTMLElement[] = []

    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue
      if (child === overlay || child.contains(overlay)) continue
      if (child.inert) continue

      child.inert = true
      madeInert.push(child)
    }

    return () => {
      for (const element of madeInert) element.inert = false
    }
  }, [overlayRef])
}
