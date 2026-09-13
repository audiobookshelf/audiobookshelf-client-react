'use client'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { COOKIE_NAMES, writePreferenceCookie } from '@/lib/cookies'
import { AVAILABLE_COVER_SIZES, coverSizeToIndex, coverSizeToMultiplier } from '@/lib/coverSizes'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/** Fixed size multiplier on mobile (100px cover), where the size is not adjustable */
const MOBILE_SIZE_MULTIPLIER = 5 / 6
interface CardSizeContextValue {
  /** Whether the current viewport is mobile (< sm breakpoint) */
  isMobile: boolean
  /**
   * The effective size multiplier, fixed on mobile.
   * Use this as the default; can be overridden by a prop.
   */
  sizeMultiplier: number
  /** The saved width, used on non-mobile viewports */
  coverWidth: number
  /** Update and persist the cover width. */
  setCoverSize: (width: number) => void
}

const CardSizeContext = createContext<CardSizeContextValue | undefined>(undefined)

export function CardSizeProvider({
  children,
  initialCoverSize,
  initialIsMobile = false
}: {
  children: React.ReactNode
  initialCoverSize?: number
  /** Viewport for SSR and first paint, from the user agent */
  initialIsMobile?: boolean
}) {
  const [coverWidth, setCoverWidth] = useState(() => AVAILABLE_COVER_SIZES[coverSizeToIndex(initialCoverSize)])
  const isMobile = useMediaQuery('max-sm', initialIsMobile)

  const sizeMultiplier = isMobile ? MOBILE_SIZE_MULTIPLIER : coverSizeToMultiplier(coverWidth)

  const setCoverSize = useCallback((width: number) => {
    if (AVAILABLE_COVER_SIZES[coverSizeToIndex(width)] !== width) return
    setCoverWidth(width)
    // Written directly rather than through a route: a Set-Cookie response would invalidate
    // the router cache and refetch the page on every click
    writePreferenceCookie(COOKIE_NAMES.coverSize, String(width))
  }, [])

  const value: CardSizeContextValue = useMemo(
    () => ({
      isMobile,
      sizeMultiplier,
      coverWidth,
      setCoverSize
    }),
    [isMobile, sizeMultiplier, coverWidth, setCoverSize]
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
