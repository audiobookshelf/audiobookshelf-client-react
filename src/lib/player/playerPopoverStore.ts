'use client'

import { useEffect } from 'react'

/**
 * Which player popovers are open right now.
 *
 * The popovers portal to `document.body`, so nothing in the tree can see them. Global hotkeys
 * need this so Escape closes a popover instead of the player or fullscreen overlay.
 */
const openPopovers = new Set<string>()

function setPlayerPopoverOpen(id: string, isOpen: boolean) {
  if (isOpen) openPopovers.add(id)
  else openPopovers.delete(id)
}

/** Read outside React, for the hotkey handler */
export function isPlayerPopoverOpen(): boolean {
  return openPopovers.size > 0
}

/** Publishes a popover's open state for the lifetime of the component */
export function useRegisterPlayerPopover(id: string, isOpen: boolean) {
  useEffect(() => {
    setPlayerPopoverOpen(id, isOpen)
    return () => setPlayerPopoverOpen(id, false)
  }, [id, isOpen])
}
