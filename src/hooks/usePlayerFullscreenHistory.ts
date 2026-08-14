'use client'

import { useEffect, useRef } from 'react'

const HISTORY_STATE_KEY = 'absPlayerFullscreen'

function historyEntryIsFullscreen(): boolean {
  return Boolean(window.history.state?.[HISTORY_STATE_KEY])
}

/**
 * Close fullscreen, wait until its dummy history entry is gone, then navigate.
 *
 * A Link's own `router.push` races the close cleanup's `history.back()` and loses — the
 * dummy pop undoes the route change and the user stays on the page they were already on.
 * Modified clicks (new tab, etc.) should not call this; let the browser handle those.
 */
export function navigateAfterFullscreenClose(close: () => void, navigate: () => void) {
  if (!historyEntryIsFullscreen()) {
    close()
    navigate()
    return
  }

  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    window.removeEventListener('popstate', finish)
    navigate()
  }

  window.addEventListener('popstate', finish)
  close()

  // close() pops asynchronously. If it did not (already closing, or the entry was gone),
  // do not wait for a popstate that will never come.
  if (!historyEntryIsFullscreen()) {
    finish()
  }
}

/**
 * Makes the hardware/browser back button dismiss the fullscreen player instead of navigating
 * away from the page underneath it — the behaviour every native media app has.
 *
 * Opening pushes a throwaway history entry on the current URL; back pops it and closes the
 * player. Closing from the UI pops the entry itself, so the button is never left needing a
 * second press.
 */
export function usePlayerFullscreenHistory(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    window.history.pushState({ ...window.history.state, [HISTORY_STATE_KEY]: true }, '')
    let ownsHistoryEntry = true

    const handlePopState = () => {
      // The entry is already gone — closing must not pop a second one
      ownsHistoryEntry = false
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Only when our entry is still the current one. Links out of fullscreen wait for this
      // pop before they router.push — popping after they had already pushed undid the navigation.
      if (ownsHistoryEntry && window.history.state?.[HISTORY_STATE_KEY]) {
        window.history.back()
      }
    }
  }, [isOpen])
}
