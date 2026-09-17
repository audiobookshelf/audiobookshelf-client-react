'use client'

const HISTORY_TRAP_KEY = '__absHistoryTrap'

interface HistoryTrapMarker {
  id: string
}

interface TrapSession {
  id: string
  href: string
  hasDummyEntry: boolean
}

/** `popstate` events this coordinator already consumed (same event can reach multiple paths). */
const handledEvents = new WeakSet<PopStateEvent>()
/** `window` the capture listener is attached to. */
let owner: Window | undefined
/** In-memory dummy: id, href, and whether that entry is currently on the stack. */
let session: TrapSession | undefined
/** True while a `reconcile()` microtask is queued. */
let scheduled = false
/** Suffix for dummy ids so two sessions in the same millisecond stay distinct. */
let nextId = 0
/** True while a swallowed `history.go(-1)` is popping the dummy. */
let removing = false
/** True while `history.forward()` is restoring a consumed dummy. */
let restoringDummy = false
/** True when Forward/revisit of a leftover dummy should notify the router after cleanup. */
let restoringNavigation = false
/** Skip the next dummy pop, for intentional in-app navigation (e.g. post-save replace). */
let skipNextReleasePopFlag = false
/** Page Back handler. Runs only when the overlay stack is empty. */
let pageHandler: (() => void) | undefined
/** Overlay Back handlers. Last registered runs first. */
const overlays: Array<() => void> = []

/**
 * Reads `__absHistoryTrap` from a history `state` value.
 *
 * @returns The marker when `state` has a string `id`, otherwise `undefined`
 */
function readTrapMarker(state: unknown): HistoryTrapMarker | undefined {
  const record = state as Record<string, unknown> | null
  const value = record?.[HISTORY_TRAP_KEY]
  if (!value || typeof value !== 'object') return undefined
  const id = (value as HistoryTrapMarker).id
  if (typeof id !== 'string') return undefined
  return { id }
}

function needsDummy(): boolean {
  return overlays.length > 0 || pageHandler != null
}

function trapPayload(): HistoryTrapMarker | undefined {
  if (!session || !needsDummy()) return undefined
  return { id: session.id }
}

/**
 * Shallow-copies a history `state` object and strips `__absHistoryTrap`.
 *
 * Used when pushing a dummy so Next/router keys on the current entry are kept
 * and a previous trap marker is not copied forward.
 */
function historyStateWithoutTrapKeys(state: unknown): Record<string, unknown> {
  const next = state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}
  delete next[HISTORY_TRAP_KEY]
  return next
}

/**
 * Pushes one same-URL dummy tagged `__absHistoryTrap`.
 *
 * Nested dialogs (e.g. confirm) share that single entry. Extra dummies leave Chrome
 * unable to fire the next Back. Layers are dismissed via popstate, then the dummy
 * is restored so history still matches "layers open".
 */
function pushDummy() {
  if (!session) return
  const payload = trapPayload()
  if (!payload) return
  window.history.pushState({ ...historyStateWithoutTrapKeys(window.history.state), [HISTORY_TRAP_KEY]: payload }, '', session.href)
}

/**
 * Syncs the single dummy history entry with registered handlers.
 *
 * At most one same-URL dummy is on the stack. Closing the last handler while still
 * sitting on that dummy pops it (`history.go(-1)`) so Close does not leave an extra
 * Back.
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

  const dummyNeeded = needsDummy()
  if (dummyNeeded && !session) {
    session = { id: `${Date.now()}-${++nextId}`, href: window.location.href, hasDummyEntry: false }
  }

  if (!session) return

  if (session.hasDummyEntry && !dummyNeeded) {
    if (!current) {
      session.hasDummyEntry = false
      session = undefined
      return
    }
    removing = true
    window.history.go(-1)
    return
  }

  if (dummyNeeded && !session.hasDummyEntry) {
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
  if (!needsDummy() || readTrapMarker(window.history.state) || restoringDummy) return
  restoringDummy = true
  window.history.forward()
}

/**
 * Attaches capture `popstate` once for this `window` and resets coordinator flags.
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
 * Capture-phase popstate handler. This is the only listener the trap installs.
 *
 * Browser Back and Forward always land here. Most of those moves are not real
 * navigations: they are the dummy being consumed, restored, or skipped. This
 * handler decides which, swallows the ones that should stay invisible to the
 * router, and runs overlay then page Back handlers when the dummy was consumed.
 *
 * Already-handled events are ignored. A restore-forward is swallowed so putting
 * the dummy back does not look like a user navigation. Unrelated pops (no dummy
 * involved) are left for other listeners. A silent pop of the dummy is also
 * swallowed, except when skipping a leftover dummy after a real navigation - in
 * that case the follow-up pop is the actual route change and the router must see
 * it.
 *
 * When the user backs out of the dummy, the last overlay runs first, then the page
 * handler if the overlay stack is empty. If anyone still needs the trap, the dummy
 * is restored. Landing on a dummy nobody owns (Forward onto a leftover) skips it
 * without reopening overlays. Landing on a dummy that is still needed only
 * resyncs session state; closed overlays stay closed.
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

  if (target && !needsDummy()) {
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
  if (skipNextReleasePopFlag && !needsDummy()) {
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
