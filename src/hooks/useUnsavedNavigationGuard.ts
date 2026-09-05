'use client'

import { useEffect, useRef } from 'react'
import { handleModalPopState, removeHistoryEntrySilently, whenModalHistoryIdle } from '@/hooks/useModalHistory'

const BACK_COOLDOWN_MS = 400

let guardEnabled = false
let skipHistoryTrapRemoval = false

/**
 * Call before disabling the guard for an intentional in-app navigation (e.g. post-save redirect).
 * Skips the history-trap pop that would otherwise race with `router.replace`.
 */
export function allowProgrammaticNavigationWithoutTrapCleanup() {
  skipHistoryTrapRemoval = true
}

export interface UseUnsavedNavigationGuardOptions {
  /** When true, link clicks and browser back are converted to a full document load so beforeunload can prompt. */
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
  const generationRef = useRef(0)

  useEffect(() => {
    guardEnabled = enabled
    return () => {
      guardEnabled = false
    }
  }, [enabled])

  useEffect(() => {
    const generation = ++generationRef.current
    const isCurrentGeneration = () => generationRef.current === generation
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

    const cancelTrapSetup = whenModalHistoryIdle(() => {
      if (!trapActiveRef.current) {
        originalPushState({ ...history.state, __unsavedGuard: true }, '', window.location.href)
        trapActiveRef.current = true
      }
    })

    const onPopState = (event: PopStateEvent) => {
      if (handleModalPopState(event)) return
      if (!enabledRef.current || backHandlingRef.current) return

      event.stopImmediatePropagation()
      backHandlingRef.current = true

      originalPushState({ ...history.state, __unsavedGuard: true }, '', guardHref())

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
      cancelTrapSetup()
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState, true)

      if (skipHistoryTrapRemoval) {
        trapActiveRef.current = false
        skipHistoryTrapRemoval = false
      } else {
        // The trap can only be popped after modal cleanup, and only if still on this page.
        whenModalHistoryIdle(() => {
          if (!trapActiveRef.current || (!isCurrentGeneration() && enabledRef.current)) return
          trapActiveRef.current = false
          if (getCurrentLocationKey() === guardLocationKeyRef.current && history.state?.__unsavedGuard) {
            removeHistoryEntrySilently()
          }
        })
      }

      backHandlingRef.current = false
    }
  }, [enabled])
}
