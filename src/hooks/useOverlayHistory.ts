'use client'

import { registerOverlay } from '@/lib/historyTrap'
import { useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'

/**
 * Registers an open layer with the shared history trap.
 *
 * While `isOpen`, browser Back runs `onBack` before leaving the page. Nested
 * layers share one dummy entry; the last registered layer closes first.
 * `onBack` runs inside `flushSync` so this layer unregisters before the trap
 * restores or pops that dummy.
 */
export function useOverlayHistory(isOpen: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useLayoutEffect(() => {
    if (!isOpen) return
    return registerOverlay(() => {
      flushSync(() => onBackRef.current())
    })
  }, [isOpen])
}
