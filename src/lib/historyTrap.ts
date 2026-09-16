'use client'

export const HISTORY_TRAP_KEY = '__absHistoryTrap'

export interface HistoryTrapMarker {
  id: string
}

interface TrapSession {
  id: string
  href: string
  hasDummyEntry: boolean
}

const handledEvents = new WeakSet<PopStateEvent>()
let owner: Window | undefined
let session: TrapSession | undefined
let scheduled = false
let nextId = 0
let removing = false
let restoringDummy = false
let restoringNavigation = false
let skipNextReleasePopFlag = false
let pageHandler: (() => void) | undefined
const overlays: Array<() => void> = []

function readTrapMarker(state: unknown): HistoryTrapMarker | undefined {
  const record = state as Record<string, unknown> | null
  const value = record?.[HISTORY_TRAP_KEY]
  if (!value || typeof value !== 'object') return undefined
  const id = (value as HistoryTrapMarker).id
  if (typeof id !== 'string') return undefined
  return { id }
}

function wantsDummy(): boolean {
  return overlays.length > 0 || pageHandler != null
}

function trapPayload(): HistoryTrapMarker | undefined {
  if (!session || !wantsDummy()) return undefined
  return { id: session.id }
}

function historyStateWithoutTrapKeys(state: unknown): Record<string, unknown> {
  const next = state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}
  delete next[HISTORY_TRAP_KEY]
  return next
}

function pushDummy() {
  if (!session) return
  const payload = trapPayload()
  if (!payload) return
  window.history.pushState({ ...historyStateWithoutTrapKeys(window.history.state), [HISTORY_TRAP_KEY]: payload }, '', session.href)
}

/**
 * Syncs the single dummy history entry with registered layers.
 *
 * At most one same-URL dummy is on the stack. Closing the last layer while still
 * sitting on that dummy pops it (`history.go(-1)`) so Close does not leave an extra
 * Back. Phantom Forward is skipped in the leftover-dummy path.
 */
function reconcile() {
  scheduled = false
  if (removing) return

  const current = readTrapMarker(window.history.state)
  if (session && window.location.href !== session.href) {
    session = undefined
  } else if (session && current?.id && current.id !== session.id) {
    session = undefined
  }

  if (wantsDummy() && !session) {
    session = { id: `${Date.now()}-${++nextId}`, href: window.location.href, hasDummyEntry: false }
  }

  if (!session) return

  const wantDummy = wantsDummy()
  if (session.hasDummyEntry && !wantDummy) {
    if (!current) {
      session.hasDummyEntry = false
      session = undefined
      return
    }
    removing = true
    window.history.go(-1)
    return
  }

  if (wantDummy && !session.hasDummyEntry) {
    session.hasDummyEntry = true
    pushDummy()
  }
}

/**
 * Queues a single `reconcile()` after the current layout/effects settle.
 *
 * Open/close often add and remove layers in the same turn (Strict Mode remount,
 * parent and child closing together). A microtask folds those into one history
 * sync instead of push/strip/push on each add/delete.
 */
function scheduleReconcile() {
  if (scheduled) return
  scheduled = true
  queueMicrotask(reconcile)
}

function restoreConsumedDummy() {
  if (!wantsDummy() || readTrapMarker(window.history.state) || restoringDummy) return
  restoringDummy = true
  window.history.forward()
}

/**
 * Attaches capture `popstate` once for this `window`.
 *
 * If a reload left a trap marker with no layers, schedules reconcile so that leftover dummy is popped.
 */
function ensureHistoryTrapListener() {
  if (owner === window) return
  owner?.removeEventListener('popstate', handleHistoryTrapPopState, true)
  owner = window
  owner.addEventListener('popstate', handleHistoryTrapPopState, true)
  session = undefined
  removing = false
  restoringDummy = false
  restoringNavigation = false
  const current = readTrapMarker(window.history.state)
  if (current) {
    session = { id: current.id, href: window.location.href, hasDummyEntry: true }
    scheduleReconcile()
  }
}

/**
 * Capture-phase `popstate` handler (the only history-trap listener).
 *
 * Back priority: last overlay, then page. One dummy covers all of them.
 */
function handleHistoryTrapPopState(event: PopStateEvent) {
  if (handledEvents.has(event)) return
  if (restoringDummy) {
    restoringDummy = false
    handledEvents.add(event)
    event.stopImmediatePropagation()
    const restored = readTrapMarker(event.state)
    if (session && restored) session.hasDummyEntry = true
    return
  }

  if (removing) {
    removing = false
    const target = readTrapMarker(event.state)
    if (session) {
      session.hasDummyEntry = Boolean(target)
      if (!target) session = undefined
    }
    // User Forward/Back landed on a leftover dummy; the follow-up go(-1) is the real navigation.
    const notifyRouter = restoringNavigation && !target
    if (!target) restoringNavigation = false
    if (!notifyRouter) {
      handledEvents.add(event)
      event.stopImmediatePropagation()
    }
    reconcile()
    return
  }

  const target = readTrapMarker(event.state)
  const hadDummyEntry = session?.hasDummyEntry ?? false
  if (!hadDummyEntry && !target) return

  if (hadDummyEntry && !target) {
    const overlay = overlays[overlays.length - 1]
    if (overlay) {
      handledEvents.add(event)
      event.stopImmediatePropagation()
      overlay()
      restoreConsumedDummy()
      reconcile()
      return
    }
    if (pageHandler) {
      handledEvents.add(event)
      event.stopImmediatePropagation()
      restoreConsumedDummy()
      reconcile()
      pageHandler()
      return
    }
    if (session) {
      session.hasDummyEntry = false
      session = undefined
    }
    return
  }

  if (target && !wantsDummy()) {
    handledEvents.add(event)
    event.stopImmediatePropagation()
    restoringNavigation = true
    session = { id: target.id, href: window.location.href, hasDummyEntry: true }
    removing = true
    window.history.go(-1)
    return
  }

  if (target) {
    handledEvents.add(event)
    event.stopImmediatePropagation()
    session = { id: target.id, href: window.location.href, hasDummyEntry: true }
    reconcile()
  }
}

function afterLayerChange() {
  if (skipNextReleasePopFlag && !wantsDummy()) {
    skipNextReleasePopFlag = false
    return
  }
  scheduleReconcile()
}

/**
 * Pushes an overlay Back handler. Last registered overlay runs first.
 * Nested dialogs share one registration from `useModalHistory`; eReader / player
 * fullscreen each register their own.
 *
 * `onBack` should apply the dismiss synchronously (`flushSync`) so remaining
 * layers are visible before the dummy is restored or popped.
 */
export function registerOverlay(onBack: () => void): () => void {
  ensureHistoryTrapListener()
  overlays.push(onBack)
  scheduleReconcile()
  return () => {
    const index = overlays.indexOf(onBack)
    if (index >= 0) overlays.splice(index, 1)
    afterLayerChange()
  }
}

/**
 * Registers the page Back handler. Runs only when the overlay stack is empty.
 * At most one: a later `registerPage` replaces the current handler. Cleanup is a
 * no-op if this registration is no longer current.
 */
export function registerPage(onBack: () => void): () => void {
  ensureHistoryTrapListener()
  pageHandler = onBack
  scheduleReconcile()
  return () => {
    if (pageHandler !== onBack) return
    pageHandler = undefined
    afterLayerChange()
  }
}

/**
 * Call before clearing the last handler for an intentional in-app navigation.
 * The next overlay or page unregister will not pop the dummy.
 */
export function skipNextReleasePop() {
  skipNextReleasePopFlag = true
}
