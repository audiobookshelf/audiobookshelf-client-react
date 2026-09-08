'use client'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { COOKIE_NAMES, writePreferenceCookie } from '@/lib/cookies'
import { AVAILABLE_COVER_SIZES, coverSizeToIndex, coverSizeToMultiplier } from '@/lib/coverSizes'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/** Maximum size multiplier allowed on mobile */
const MOBILE_MAX_SIZE_MULTIPLIER = 5 / 6
interface CardSizeContextValue {
  /** Whether the current viewport is mobile (< sm breakpoint) */
  isMobile: boolean
  /**
   * The effective size multiplier, capped on mobile.
   * Use this as the default; can be overridden by a prop.
   */
  sizeMultiplier: number
  /** Both layouts' widths, so a consumer resolves the viewport itself after hydration */
  coverWidth: number
  mobileCoverWidth: number
  /** Update and persist the cover width for the current viewport. */
  setCoverSize: (width: number) => void
}

const CardSizeContext = createContext<CardSizeContextValue | undefined>(undefined)

export function CardSizeProvider({
  children,
  initialCoverSize,
  initialMobileCoverSize,
  initialIsMobile = false
}: {
  children: React.ReactNode
  initialCoverSize?: number
  initialMobileCoverSize?: number
  /** Viewport for SSR and first paint, from the cookie below or the user agent on a first visit */
  initialIsMobile?: boolean
}) {
  const [coverWidth, setCoverWidth] = useState(() => AVAILABLE_COVER_SIZES[coverSizeToIndex(initialCoverSize, false)])
  const [mobileCoverWidth, setMobileCoverWidth] = useState(() => AVAILABLE_COVER_SIZES[coverSizeToIndex(initialMobileCoverSize, true)])
  const isMobile = useMediaQuery('max-sm', initialIsMobile)

  // Recorded so the next server render knows the real viewport, which the user agent
  // cannot tell it for a resized window
  useEffect(() => {
    writePreferenceCookie(COOKIE_NAMES.mobileViewport, isMobile ? '1' : '0')
  }, [isMobile])

  const sizeMultiplier = isMobile
    ? Math.min(coverSizeToMultiplier(mobileCoverWidth, true), MOBILE_MAX_SIZE_MULTIPLIER)
    : coverSizeToMultiplier(coverWidth, false)

  const setCoverSize = useCallback(
    (width: number) => {
      if (isMobile) setMobileCoverWidth(width)
      else setCoverWidth(width)
      // Written directly rather than through a route: a Set-Cookie response would invalidate
      // the router cache and refetch the page on every click
      writePreferenceCookie(isMobile ? COOKIE_NAMES.mobileCoverSize : COOKIE_NAMES.coverSize, String(width))
    },
    [isMobile]
  )

  const value: CardSizeContextValue = useMemo(
    () => ({
      isMobile,
      sizeMultiplier,
      coverWidth,
      mobileCoverWidth,
      setCoverSize
    }),
    [isMobile, sizeMultiplier, coverWidth, mobileCoverWidth, setCoverSize]
  )

  return <CardSizeContext.Provider value={value}>{children}</CardSizeContext.Provider>
}

export function useCardSize(): CardSizeContextValue {
  const ctx = useContext(CardSizeContext)
  if (!ctx) {
    throw new Error('useCardSize must be used within a CardSizeProvider')
  }
  return ctx
}
