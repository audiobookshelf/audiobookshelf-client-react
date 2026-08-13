'use client'

import { useEffect, useState } from 'react'

/**
 * Keeps a component mounted for `durationMs` after it is closed, so it can play an exit
 * animation before it disappears. Collapses to an instant unmount when the user has asked
 * for reduced motion, where the extra frames would just look like lag.
 */
export function useExitTransition(isOpen: boolean, durationMs: number): { isMounted: boolean; isExiting: boolean } {
  const [isMounted, setIsMounted] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setIsExiting(false)
      return
    }

    if (!isMounted) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsMounted(false)
      return
    }

    setIsExiting(true)
    const timeout = setTimeout(() => {
      setIsExiting(false)
      setIsMounted(false)
    }, durationMs)

    return () => clearTimeout(timeout)
  }, [durationMs, isMounted, isOpen])

  return { isMounted, isExiting }
}
