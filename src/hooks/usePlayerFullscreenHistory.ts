'use client'

import { useCallback, useEffect, useRef } from 'react'

const HISTORY_FULLSCREEN_KEY = 'absPlayerFullscreen'
const HISTORY_OVERLAY_KEY = 'absPlayerOverlay'

function historyStateRecord(state: unknown): Record<string, unknown> {
  return state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}
}

function hasHistoryFlag(state: unknown, key: string): boolean {
  return Boolean(state && typeof state === 'object' && key in state && (state as Record<string, unknown>)[key])
}

function currentHasFlag(key: string): boolean {
  return hasHistoryFlag(window.history.state, key)
}

function pushHistoryFlag(key: string) {
  if (currentHasFlag(key)) return
  window.history.pushState({ ...historyStateRecord(window.history.state), [key]: true }, '')
}

function stripHistoryFlags(keys: string[]) {
  if (!window.history.state || typeof window.history.state !== 'object') return
  const rest = historyStateRecord(window.history.state)
  let changed = false
  for (const key of keys) {
    if (key in rest) {
      delete rest[key]
      changed = true
    }
  }
  if (!changed) return
  window.history.replaceState(Object.keys(rest).length ? rest : null, '')
}

export interface PlayerFullscreenHistoryOverlay {
  isOpen: boolean
  onClose: () => void
}

/**
 * Pushes disposable history entries while the player is fullscreen (and while a
 * player modal or secondary-toolbar popover is open) so browser Back closes those
 * layers instead of leaving the page. UI collapse pops the extra entries; following
 * a link strips the flags with replaceState so the navigation is not undone.
 */
export function usePlayerFullscreenHistory(isFullscreen: boolean, setFullscreen: (fullscreen: boolean) => void, overlay?: PlayerFullscreenHistoryOverlay) {
  const closingFromUiRef = useRef(false)
  const isFullscreenRef = useRef(isFullscreen)
  isFullscreenRef.current = isFullscreen
  const overlayOpenRef = useRef(overlay?.isOpen ?? false)
  overlayOpenRef.current = overlay?.isOpen ?? false
  const overlayCloseRef = useRef(overlay?.onClose)
  overlayCloseRef.current = overlay?.onClose

  useEffect(() => {
    if (!isFullscreen) return
    pushHistoryFlag(HISTORY_FULLSCREEN_KEY)
  }, [isFullscreen])

  useEffect(() => {
    if (!overlay?.isOpen) return
    pushHistoryFlag(HISTORY_OVERLAY_KEY)
  }, [overlay?.isOpen])

  useEffect(() => {
    const onPopState = () => {
      if (closingFromUiRef.current) {
        closingFromUiRef.current = false
        return
      }
      if (overlayOpenRef.current && !currentHasFlag(HISTORY_OVERLAY_KEY)) {
        overlayCloseRef.current?.()
        return
      }
      if (isFullscreenRef.current && !currentHasFlag(HISTORY_FULLSCREEN_KEY)) {
        setFullscreen(false)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [setFullscreen])

  useEffect(() => {
    if (overlay?.isOpen) return
    if (!currentHasFlag(HISTORY_OVERLAY_KEY)) return
    if (closingFromUiRef.current) return
    closingFromUiRef.current = true
    window.history.back()
  }, [overlay?.isOpen])

  useEffect(() => {
    if (isFullscreen) return
    if (!currentHasFlag(HISTORY_FULLSCREEN_KEY) && !currentHasFlag(HISTORY_OVERLAY_KEY)) return
    if (closingFromUiRef.current) return
    closingFromUiRef.current = true
    window.history.go(currentHasFlag(HISTORY_OVERLAY_KEY) && currentHasFlag(HISTORY_FULLSCREEN_KEY) ? -2 : -1)
  }, [isFullscreen])

  const collapse = useCallback(() => {
    const overlayEntry = currentHasFlag(HISTORY_OVERLAY_KEY)
    const fullscreenEntry = currentHasFlag(HISTORY_FULLSCREEN_KEY)
    if (overlayEntry || fullscreenEntry) {
      closingFromUiRef.current = true
      window.history.go(overlayEntry && fullscreenEntry ? -2 : -1)
    }
    setFullscreen(false)
  }, [setFullscreen])

  const collapseForNavigation = useCallback(() => {
    stripHistoryFlags([HISTORY_FULLSCREEN_KEY, HISTORY_OVERLAY_KEY])
    setFullscreen(false)
  }, [setFullscreen])

  return { collapse, collapseForNavigation }
}
