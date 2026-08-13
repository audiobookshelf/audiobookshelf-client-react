'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * Which player popovers are open right now.
 *
 * The popovers portal to `document.body`, so nothing in the tree can see them. Two things
 * need to: the global hotkeys, which must let Escape close a popover instead of the player,
 * and the fullscreen volume readout, which is redundant while the volume slider is on screen.
 */
export type PlayerPopoverKind = 'volume' | 'playbackRate' | 'sleepTimer'

const openPopovers = new Map<string, PlayerPopoverKind>()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setPlayerPopoverOpen(id: string, kind: PlayerPopoverKind, isOpen: boolean) {
  const wasOpen = openPopovers.has(id)
  if (wasOpen === isOpen) return

  if (isOpen) openPopovers.set(id, kind)
  else openPopovers.delete(id)

  emit()
}

/** Read outside React, for the hotkey handler */
export function isPlayerPopoverOpen(): boolean {
  return openPopovers.size > 0
}

function getSnapshot(kind: PlayerPopoverKind): boolean {
  for (const openKind of openPopovers.values()) {
    if (openKind === kind) return true
  }
  return false
}

/** Reactive read of whether any popover of `kind` is open */
export function usePlayerPopoverOpen(kind: PlayerPopoverKind): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(kind),
    () => false
  )
}

/** Publishes a popover's open state for the lifetime of the component */
export function useRegisterPlayerPopover(id: string, kind: PlayerPopoverKind, isOpen: boolean) {
  useEffect(() => {
    setPlayerPopoverOpen(id, kind, isOpen)
    return () => setPlayerPopoverOpen(id, kind, false)
  }, [id, kind, isOpen])
}
