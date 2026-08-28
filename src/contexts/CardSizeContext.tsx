'use client'

import { UserContext } from '@/contexts/UserContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { coverSizeToMultiplier } from '@/lib/coverSizes'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
  /** Update the size multiplier for the current viewport */
  setSizeMultiplier: (multiplier: number) => void
}

const CardSizeContext = createContext<CardSizeContextValue | undefined>(undefined)

export function CardSizeProvider({
  children,
  initialSizeMultiplier = DEFAULT_SIZE_MULTIPLIER,
  initialMobileSizeMultiplier = DEFAULT_SIZE_MULTIPLIER,
  initialIsMobile = false
}: {
  children: React.ReactNode
  initialSizeMultiplier?: number
  initialMobileSizeMultiplier?: number
  /** Server-side guess of the viewport (from the user agent), used only for SSR and first paint */
  initialIsMobile?: boolean
}) {
  const [baseSizeMultiplier, setBaseSizeMultiplier] = useState(initialSizeMultiplier)
  const [mobileSizeMultiplier, setMobileSizeMultiplier] = useState(initialMobileSizeMultiplier)
  const isMobile = useMediaQuery('max-sm', initialIsMobile)

  // Track the saved cover sizes so a change on another tab or device applies on every page.
  // Depends on the sizes rather than the settings object, which is replaced on every user update.
  const clientSettings = useContext(UserContext)?.clientSettings
  const hasClientSettings = clientSettings !== undefined
  const savedCoverSize = clientSettings?.bookshelfCoverSize
  const savedMobileCoverSize = clientSettings?.bookshelfCoverSizeMobile
  useEffect(() => {
    if (!hasClientSettings) return
    setBaseSizeMultiplier(coverSizeToMultiplier(savedCoverSize, false))
    setMobileSizeMultiplier(coverSizeToMultiplier(savedMobileCoverSize, true))
  }, [hasClientSettings, savedCoverSize, savedMobileCoverSize])

  const sizeMultiplier = isMobile ? Math.min(mobileSizeMultiplier, MOBILE_MAX_SIZE_MULTIPLIER) : baseSizeMultiplier

  const setSizeMultiplier = useCallback(
    (multiplier: number) => {
      if (isMobile) setMobileSizeMultiplier(multiplier)
      else setBaseSizeMultiplier(multiplier)
    },
    [isMobile]
  )

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
