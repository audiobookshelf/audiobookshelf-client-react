'use client'

import { registerOverlay, skipNextReleasePop } from '@/lib/historyTrap'
import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Registers the fullscreen player with the shared history trap so browser Back
 * collapses it instead of leaving the page.
 *
 * Player modals register through `useModalHistory`. Toolbar popovers register
 * through `useOverlayHistory`. The Back handler drops this registration before
 * starting the cover morph: the morph updates the DOM in a later turn, and the
 * trap decides whether to restore its dummy as soon as the handler returns.
 * UI collapse only updates fullscreen state; the trap pops its dummy when the
 * last layer unregisters. Following an in-app link skips that pop so the
 * navigation is not undone.
 */
export function usePlayerFullscreenHistory(isFullscreen: boolean, setFullscreen: (fullscreen: boolean) => void) {
  const setFullscreenRef = useRef(setFullscreen)
  setFullscreenRef.current = setFullscreen
  const isFullscreenRef = useRef(isFullscreen)
  isFullscreenRef.current = isFullscreen

  useLayoutEffect(() => {
    if (!isFullscreen) return

    let unregister = () => {}
    unregister = registerOverlay(() => {
      // Unregister before setFullscreen. The cover morph commits on a later turn, and the
      // trap restores its dummy if this layer is still registered when the handler returns.
      unregister()
      setFullscreenRef.current(false)
    })
    return () => unregister()
  }, [isFullscreen])

  const collapse = useCallback(() => {
    setFullscreen(false)
  }, [setFullscreen])

  const collapseForNavigation = useCallback(() => {
    if (isFullscreenRef.current) {
      skipNextReleasePop()
    }
    setFullscreen(false)
  }, [setFullscreen])

  return { collapse, collapseForNavigation }
}
