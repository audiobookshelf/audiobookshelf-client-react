'use client'

import { fetchLibraryItemsAction } from '@/app/actions/libraryActions'
import { useUser } from '@/contexts/UserContext'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { CHROMECAST_CUSTOM_NAMESPACE, ensureCastSenderScript, initializeCastApi } from '@/lib/player/chromecastConstants'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

interface ChromecastContextValue {
  isChromecastInitialized: boolean
  isCasting: boolean
  isHttps: boolean
}

const ChromecastContext = createContext<ChromecastContextValue | undefined>(undefined)

type CastSessionActiveListener = (isActive: boolean) => void

const castSessionActiveListeners = new Set<CastSessionActiveListener>()

let castLibraryId: string | null = null

export function setChromecastLibraryId(libraryId: string | null): void {
  castLibraryId = libraryId
}

export function subscribeCastSessionActive(listener: CastSessionActiveListener): () => void {
  castSessionActiveListeners.add(listener)
  return () => {
    castSessionActiveListeners.delete(listener)
  }
}

function notifyCastSessionActive(isActive: boolean): void {
  castSessionActiveListeners.forEach((listener) => listener(isActive))
}

/** Cast requires HTTPS in production; dev is allowed (parity with Vue Appbar). */
function isCastSecureContext(): boolean {
  if (typeof window === 'undefined') return true
  return window.location.protocol === 'https:' || process.env.NODE_ENV === 'development'
}

async function sendCastReceiverInit(libraryId: string): Promise<void> {
  try {
    const data = await fetchLibraryItemsAction(libraryId, 'limit=40&minified=1')
    const covers = (data?.results ?? [])
      .filter((item) => item.media?.coverPath)
      .map((libraryItem) => {
        const coverUrl = getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt)
        if (process.env.NODE_ENV === 'development') return coverUrl
        return `${window.location.origin}${coverUrl}`
      })

    const castSession = window.cast?.framework.CastContext.getInstance().getCurrentSession()
    castSession?.sendMessage(CHROMECAST_CUSTOM_NAMESPACE, { covers })
  } catch (error) {
    console.error('[Chromecast] Failed to send receiver init message', error)
  }
}

export function ChromecastProvider({ children }: { children: React.ReactNode }) {
  const { serverSettings, userDefaultLibraryId } = useUser()
  const [isChromecastInitialized, setIsChromecastInitialized] = useState(false)
  const [isCasting, setIsCasting] = useState(false)
  const isHttps = useMemo(() => isCastSecureContext(), [])
  const libraryIdRef = useRef(userDefaultLibraryId)
  libraryIdRef.current = userDefaultLibraryId

  useEffect(() => {
    if (!serverSettings.chromecastEnabled) return

    let active = true

    const handleSessionStateChanged = (sessionState: string) => {
      if (!active) return

      switch (sessionState) {
        case 'SESSION_STARTED':
          setIsCasting(true)
          {
            const libraryId = castLibraryId ?? libraryIdRef.current
            if (libraryId) {
              void sendCastReceiverInit(libraryId)
            }
          }
          window.setTimeout(() => {
            if (active) notifyCastSessionActive(true)
          }, 500)
          break
        case 'SESSION_RESUMED':
          window.setTimeout(() => {
            if (active) notifyCastSessionActive(true)
          }, 500)
          break
        case 'SESSION_ENDED':
          setIsCasting(false)
          notifyCastSessionActive(false)
          break
      }
    }

    const tryInitializeCast = () => {
      if (!active) return false
      const initialized = initializeCastApi(handleSessionStateChanged)
      if (initialized) {
        setIsChromecastInitialized(true)
      }
      return initialized
    }

    if (!tryInitializeCast()) {
      const previousHandler = window.__onGCastApiAvailable
      window.__onGCastApiAvailable = (isAvailable) => {
        previousHandler?.(isAvailable)
        if (!isAvailable) return
        tryInitializeCast()
      }
      ensureCastSenderScript()
    }

    return () => {
      active = false
    }
  }, [serverSettings.chromecastEnabled])

  const value = useMemo(
    () => ({
      isChromecastInitialized,
      isCasting,
      isHttps
    }),
    [isCasting, isChromecastInitialized, isHttps]
  )

  return <ChromecastContext.Provider value={value}>{children}</ChromecastContext.Provider>
}

export function useChromecast(): ChromecastContextValue {
  const context = useContext(ChromecastContext)
  if (!context) {
    throw new Error('useChromecast must be used within ChromecastProvider')
  }
  return context
}
