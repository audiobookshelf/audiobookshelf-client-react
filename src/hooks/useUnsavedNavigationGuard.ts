'use client'

import { useEffect, useRef } from 'react'

const BACK_COOLDOWN_MS = 400

let guardEnabled = false

export interface UseUnsavedNavigationGuardOptions {
  /** When true, soft navigation is converted to a full reload so beforeunload can prompt. */
  enabled: boolean
  /** Where browser back should attempt to go (session return path). */
  backLeavePath?: string
}

function getLocationKey(pathname: string, search: string, hash: string): string {
  return pathname + search + hash
}

function getCurrentLocationKey(): string {
  return getLocationKey(window.location.pathname, window.location.search, window.location.hash)
}

function getLocationKeyFromHref(href: string): string {
  const url = new URL(href)
  return getLocationKey(url.pathname, url.search, url.hash)
}

function resolveSameOriginUrl(url: string | URL | null | undefined): string | null {
  if (url == null || url === '') return null
  const resolved = new URL(String(url), window.location.href)
  if (resolved.origin !== window.location.origin) return null
  return resolved.href
}

/** Full-document navigation to trigger beforeunload. Returns true when assign was called. */
function tryAssignLeave(url: string, currentLocationKey: string): boolean {
  const resolved = resolveSameOriginUrl(url)
  if (!resolved) return false
  if (getLocationKeyFromHref(resolved) === currentLocationKey) return false

  window.location.assign(resolved)
  return true
}

/**
 * Call before programmatic soft navigation (`router.push` / `router.replace`).
 * Returns false when the guard started a full-page leave attempt — do not call the router.
 */
export function attemptGuardedNavigation(url: string): boolean {
  if (!guardEnabled) return true
  if (tryAssignLeave(url, getCurrentLocationKey())) return false
  return true
}

/**
 * Blocks soft client-side navigation when there are unsaved changes.
 * Matches Vue batch edit beforeRouteLeave: force a full document load so beforeunload prompts.
 */
export function useUnsavedNavigationGuard({ enabled, backLeavePath }: UseUnsavedNavigationGuardOptions) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const guardLocationKeyRef = useRef('')
  const backLeavePathRef = useRef(backLeavePath)
  backLeavePathRef.current = backLeavePath
  const trapActiveRef = useRef(false)
  const backHandlingRef = useRef(false)

  useEffect(() => {
    guardEnabled = enabled
    return () => {
      guardEnabled = false
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    guardLocationKeyRef.current = getCurrentLocationKey()
    const guardHref = () => window.location.origin + guardLocationKeyRef.current
    const leaveViaFullReload = (url: string) => tryAssignLeave(url, guardLocationKeyRef.current)

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabledRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    const onClick = (event: MouseEvent) => {
      if (!enabledRef.current) return
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.hasAttribute('download')) return

      const target = anchor.getAttribute('target')
      if (target && target !== '_self') return

      if (leaveViaFullReload(anchor.href)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const originalPushState = history.pushState.bind(history)
    const originalReplaceState = history.replaceState.bind(history)

    const interceptHistoryNavigation = (original: typeof history.pushState, state: unknown, title: string, url?: string | URL | null) => {
      const resolved = resolveSameOriginUrl(url)
      if (resolved && leaveViaFullReload(resolved)) return
      original(state, title, url ?? '')
    }

    history.pushState = (state, title, url) => {
      interceptHistoryNavigation(originalPushState, state, title, url)
    }

    history.replaceState = (state, title, url) => {
      interceptHistoryNavigation(originalReplaceState, state, title, url)
    }

    if (!trapActiveRef.current) {
      originalPushState({ __unsavedGuard: true }, '', window.location.href)
      trapActiveRef.current = true
    }

    const onPopState = (event: PopStateEvent) => {
      if (!enabledRef.current || backHandlingRef.current) return

      event.stopImmediatePropagation()
      backHandlingRef.current = true

      originalPushState({ __unsavedGuard: true }, '', guardHref())

      const leavePath = backLeavePathRef.current
      if (!leavePath || !leaveViaFullReload(leavePath)) {
        backHandlingRef.current = false
        return
      }

      window.setTimeout(() => {
        backHandlingRef.current = false
      }, BACK_COOLDOWN_MS)
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState, true)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState, true)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState

      if (trapActiveRef.current) {
        trapActiveRef.current = false
        window.history.back()
      }

      backHandlingRef.current = false
    }
  }, [enabled])
}
