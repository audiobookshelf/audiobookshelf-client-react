import { useEffect } from 'react'

export const PLAYER_CLOSE_SECONDARY_POPOVERS_EVENT = 'abs:close-player-secondary-popovers'

export function closePlayerSecondaryPopovers() {
  window.dispatchEvent(new CustomEvent(PLAYER_CLOSE_SECONDARY_POPOVERS_EVENT))
}

/** Close when fullscreen collapses or browser Back dismisses a player overlay. */
export function usePlayerSecondaryPopoverDismiss(setOpen: (open: boolean) => void) {
  useEffect(() => {
    const onClose = () => setOpen(false)
    window.addEventListener(PLAYER_CLOSE_SECONDARY_POPOVERS_EVENT, onClose)
    return () => window.removeEventListener(PLAYER_CLOSE_SECONDARY_POPOVERS_EVENT, onClose)
  }, [setOpen])
}
