'use client'

import { useEffect } from 'react'

// Brave on iOS sometimes keeps a stale safe-area-sized inset (47px on iPhone) after a fast rotation: the visible
// width stays narrower than the layout width until reload. Mid-rotation states differ by hundreds of px and recover.
const MAX_STUCK_INSET_PX = 100
const SETTLE_DELAY_MS = 500
const RELOAD_COOLDOWN_MS = 5000
const RELOAD_STORAGE_KEY = 'braveViewportGuardReloadedAt'

function isBraveIos() {
  // iPadOS reports a desktop Mac user agent; touch support tells it apart
  const isIos = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  return isIos && 'brave' in navigator
}

function isStuck() {
  const narrowerBy = document.documentElement.clientWidth - window.innerWidth
  const scale = window.visualViewport?.scale ?? 1
  return narrowerBy > 1 && narrowerBy < MAX_STUCK_INSET_PX && Math.abs(scale - 1) < 0.01
}

function isMediaPlaying() {
  return Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video')).some((media) => !media.paused)
}

function reloadedRecently() {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOAD_STORAGE_KEY)) < RELOAD_COOLDOWN_MS
  } catch {
    return false
  }
}

/**
 * Works around Brave iOS leaving the page horizontally overflowing after a fast rotation (or a load).
 * Only a reload clears Brave's stale inset, so the page reloads unless media is playing.
 */
export default function BraveViewportGuard() {
  useEffect(() => {
    if (!isBraveIos()) return

    let timer: number | undefined

    const check = () => {
      if (!isStuck() || isMediaPlaying() || reloadedRecently()) return
      try {
        sessionStorage.setItem(RELOAD_STORAGE_KEY, String(Date.now()))
      } catch {
        // Without storage there is no reload loop guard, so skip the reload
        return
      }
      // Blank the page so the broken layout does not flash while the reload starts
      document.documentElement.style.visibility = 'hidden'
      window.location.reload()
    }

    const scheduleCheck = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(check, SETTLE_DELAY_MS)
    }

    // screen.orientation needs iOS 16.4+; the deprecated orientationchange covers older iOS.
    // Both fire on newer iOS, which is harmless: the handler restarts the same timer.
    // visualViewport resize catches the stuck state appearing without a rotation event.
    window.addEventListener('orientationchange', scheduleCheck)
    screen.orientation?.addEventListener('change', scheduleCheck)
    window.visualViewport?.addEventListener('resize', scheduleCheck)
    // The stuck state can also be present right after a (re)load
    scheduleCheck()
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('orientationchange', scheduleCheck)
      screen.orientation?.removeEventListener('change', scheduleCheck)
      window.visualViewport?.removeEventListener('resize', scheduleCheck)
    }
  }, [])

  return null
}
