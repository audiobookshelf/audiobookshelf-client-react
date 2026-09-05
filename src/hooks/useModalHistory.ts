'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import { flushSync } from 'react-dom'

const HISTORY_KEY = '__absModal'

interface HistoryMarker {
  id: string
  depth: number
}

interface ModalEntry {
  element: RefObject<HTMLDivElement | null>
  dismiss: () => void
}

interface ModalHistory {
  id: string
  href: string
  depth: number
}

const modals = new Set<ModalEntry>()
const idleCallbacks = new Set<() => void>()
const handledEvents = new WeakSet<PopStateEvent>()
let owner: Window | undefined
let modalHistory: ModalHistory | undefined
let removing = false
let scheduled = false
let nextId = 0
let restoringNavigation = false

function marker(state: unknown): HistoryMarker | undefined {
  const value = (state as Record<string, unknown> | null)?.[HISTORY_KEY] as HistoryMarker | undefined
  return value && typeof value.id === 'string' && Number.isInteger(value.depth) && value.depth > 0 ? value : undefined
}

function topModal(): ModalEntry | undefined {
  // Match Escape's portal order, including children mounted before their parent effects.
  const wrappers = document.querySelectorAll('[data-abs-modal]')
  const element = wrappers[wrappers.length - 1]
  return [...modals].find((entry) => entry.element.current === element)
}

function reconcile() {
  scheduled = false
  if (removing) return

  const current = marker(window.history.state)
  if (modalHistory && (window.location.href !== modalHistory.href || (modalHistory.depth > 0 && current?.id !== modalHistory.id))) {
    // A real navigation owns the current entry. Unmounting must never undo it.
    modalHistory = undefined
  }

  if (modals.size > 0 && !modalHistory) {
    modalHistory = { id: `${Date.now()}-${++nextId}`, href: window.location.href, depth: 0 }
  }

  if (modalHistory) {
    const difference = modals.size - modalHistory.depth
    if (difference < 0) {
      removing = true
      window.history.go(difference)
      return
    }
    // One same-URL entry per layer lets each Back consume exactly one dismissal.
    while (modalHistory.depth < modals.size) {
      modalHistory.depth++
      window.history.pushState({ ...window.history.state, [HISTORY_KEY]: { id: modalHistory.id, depth: modalHistory.depth } }, '', modalHistory.href)
    }
  }

  if (modals.size === 0) {
    for (const callback of [...idleCallbacks]) {
      if (removing) break
      idleCallbacks.delete(callback)
      callback()
    }
  }
}

function scheduleReconcile() {
  if (scheduled) return
  scheduled = true
  // Coalesce Strict Mode cleanup/setup and simultaneous parent/child closes.
  queueMicrotask(reconcile)
}

function listen() {
  if (owner === window) return
  owner?.removeEventListener('popstate', handleModalPopState, true)
  owner = window
  owner.addEventListener('popstate', handleModalPopState, true)
  modalHistory = undefined
  removing = false
  restoringNavigation = false
  const current = marker(window.history.state)
  if (current) {
    // Reloads preserve history state but not the dialogs that created it.
    modalHistory = { id: current.id, href: window.location.href, depth: current.depth }
    scheduleReconcile()
  }
}

/** Remove an idle navigation-guard entry without delivering its cleanup to the router. */
export function removeHistoryEntrySilently() {
  listen()
  removing = true
  window.history.back()
}

/** Delay guard-trap changes until no modal entries sit above that trap. */
export function whenModalHistoryIdle(callback: () => void): () => void {
  if (modals.size === 0 && !removing && !modalHistory?.depth) callback()
  else idleCallbacks.add(callback)
  return () => idleCallbacks.delete(callback)
}

/** Called by the navigation guard too, so capture-listener registration order is irrelevant. */
export function handleModalPopState(event: PopStateEvent): boolean {
  if (handledEvents.has(event)) return true
  const target = marker(event.state)
  const previousDepth = modalHistory?.depth ?? 0
  if (!removing && !previousDepth && !target) return false

  if (removing) {
    removing = false
    if (modalHistory) modalHistory.depth = target?.id === modalHistory.id ? target.depth : 0
    const notifyRouter = restoringNavigation && !target
    if (!target) restoringNavigation = false
    if (!notifyRouter) {
      handledEvents.add(event)
      event.stopImmediatePropagation()
    }
    reconcile()
    return !notifyRouter
  }

  handledEvents.add(event)
  event.stopImmediatePropagation()

  if (modalHistory && previousDepth > 0 && (!target || (target.id === modalHistory.id && target.depth < previousDepth))) {
    modalHistory.depth = target?.depth ?? 0
    // Commit the business close (which may open a confirmation) before rebuilding protection.
    flushSync(() => topModal()?.dismiss())
    reconcile()
    return true
  }

  // Forward/revisit must not resurrect a closed dialog or expose an extra Back step.
  if (target) {
    restoringNavigation = modals.size === 0
    modalHistory = { id: target.id, href: window.location.href, depth: target.depth }
    reconcile()
    return true
  }
  return false
}

export function useModalHistory(isOpen: boolean, element: RefObject<HTMLDivElement | null>, onClose: (() => void) | undefined, blocked: boolean) {
  const latest = useRef({ onClose, blocked })
  useLayoutEffect(() => {
    latest.current = { onClose, blocked }
  })

  useLayoutEffect(() => {
    listen()
    if (!isOpen) return
    const entry: ModalEntry = {
      element,
      dismiss: () => {
        if (!latest.current.blocked) latest.current.onClose?.()
      }
    }
    modals.add(entry)
    scheduleReconcile()
    return () => {
      modals.delete(entry)
      scheduleReconcile()
    }
  }, [isOpen, element])
}
