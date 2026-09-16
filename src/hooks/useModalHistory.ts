'use client'

import { registerOverlay } from '@/lib/historyTrap'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { flushSync } from 'react-dom'

interface ModalEntry {
  element: RefObject<HTMLDivElement | null>
  dismiss: () => void
}

const modals: ModalEntry[] = []
let overlayCleanup: (() => void) | undefined

function topModal(): ModalEntry | undefined {
  for (let i = modals.length - 1; i >= 0; i--) {
    if (modals[i].element.current) return modals[i]
  }
  return undefined
}

/**
 * DOM node of the dialog Back and Escape should dismiss.
 *
 * Last registered open modal with a mounted wrapper wins. ConfirmDialog portals to
 * body, so DOM order can put the parent last after a re-render.
 *
 * @returns The topmost open modal wrapper, or `undefined` if none is mounted
 */
export function getTopmostModalElement(): HTMLElement | undefined {
  return topModal()?.element.current ?? undefined
}

function dismissTopModal() {
  flushSync(() => topModal()?.dismiss())
}

function syncOverlayLayer() {
  if (modals.length > 0) {
    if (overlayCleanup) return
    overlayCleanup = registerOverlay(dismissTopModal)
    return
  }
  overlayCleanup?.()
  overlayCleanup = undefined
}

/**
 * Registers an open `Modal` with the shared history trap.
 *
 * While `isOpen`, the coordinator keeps one same-URL dummy so browser Back
 * dismisses the dialog first. `blocked` skips calling `onClose` (persistent/processing).
 *
 * @param isOpen Whether this modal is visible
 * @param element Ref to the modal wrapper (`[data-abs-modal]`)
 * @param onClose Close callback invoked on Back when not blocked
 * @param blocked When true, Back does not call `onClose`
 */
export function useModalHistory(isOpen: boolean, element: RefObject<HTMLDivElement | null>, onClose: (() => void) | undefined, blocked: boolean) {
  const latest = useRef({ onClose, blocked })
  useLayoutEffect(() => {
    latest.current = { onClose, blocked }
  })

  useLayoutEffect(() => {
    if (!isOpen) return
    const entry: ModalEntry = {
      element,
      dismiss: () => {
        if (!latest.current.blocked) latest.current.onClose?.()
      }
    }
    modals.push(entry)
    syncOverlayLayer()
    return () => {
      const index = modals.indexOf(entry)
      if (index >= 0) modals.splice(index, 1)
      syncOverlayLayer()
    }
  }, [isOpen, element])
}
