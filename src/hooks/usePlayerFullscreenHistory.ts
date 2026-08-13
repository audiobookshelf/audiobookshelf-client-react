'use client'

import { useEffect, useRef } from 'react'

const HISTORY_STATE_KEY = 'absPlayerFullscreen'

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
      // Only when our entry is still the current one. Following a link out of the fullscreen
      // player closes it *and* pushes a route, and going back would undo that navigation.
      if (ownsHistoryEntry && window.history.state?.[HISTORY_STATE_KEY]) {
        window.history.back()
      }
    }
  }, [isOpen])
}
