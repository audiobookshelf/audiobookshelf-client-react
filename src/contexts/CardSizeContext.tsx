'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/** Breakpoint for mobile view (matches Tailwind's sm breakpoint) */
const MOBILE_BREAKPOINT = 640
/** Maximum size multiplier allowed on mobile */
const MOBILE_MAX_SIZE_MULTIPLIER = 5 / 6
/** Default size multiplier */
const DEFAULT_SIZE_MULTIPLIER = 1

interface CardSizeContextValue {
  /** Whether the current viewport is mobile (< sm breakpoint) */
  isMobile: boolean
  /**
   * The effective size multiplier, capped on mobile.
   * Use this as the default; can be overridden by a prop.
   */
  sizeMultiplier: number
  /** Update the size multiplier */
  setSizeMultiplier: (multiplier: number) => void
}

const CardSizeContext = createContext<CardSizeContextValue | undefined>(undefined)

export function CardSizeProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [baseSizeMultiplier, setBaseSizeMultiplier] = useState(DEFAULT_SIZE_MULTIPLIER)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply mobile cap to size multiplier
  const sizeMultiplier = useMemo(() => {
    if (isMobile) {
      return Math.min(baseSizeMultiplier, MOBILE_MAX_SIZE_MULTIPLIER)
    }
    return baseSizeMultiplier
  }, [isMobile, baseSizeMultiplier])

  const setSizeMultiplier = useCallback((multiplier: number) => {
    setBaseSizeMultiplier(multiplier)
  }, [])

  const value: CardSizeContextValue = useMemo(
    () => ({
      isMobile,
      sizeMultiplier,
      setSizeMultiplier
    }),
    [isMobile, sizeMultiplier, setSizeMultiplier]
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
