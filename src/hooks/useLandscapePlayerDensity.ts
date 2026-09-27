'use client'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { LANDSCAPE_DENSITY_MAX_LEVEL, rightColumnContentOverflows, type LandscapeDensityLevel } from '@/lib/player/landscapeDensity'
import { RefObject, useLayoutEffect, useRef, useState } from 'react'

function observeRightColumnChildren(resizeObserver: ResizeObserver, rightColumn: HTMLElement) {
  for (const child of rightColumn.children) {
    resizeObserver.observe(child)
  }
}

export function useLandscapePlayerDensity(
  shellRef: RefObject<HTMLDivElement | null>,
  rightColumnRef: RefObject<HTMLDivElement | null>,
  layoutKey: string
): LandscapeDensityLevel {
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const isDesktop = useMediaQuery('lg')
  const [densityLevel, setDensityLevel] = useState<LandscapeDensityLevel>(0)
  /** Item, chapter track, and layout mode. A change starts measurement over at full UI. */
  const measureGenerationRef = useRef('')

  useLayoutEffect(() => {
    const handleResize = () => setDensityLevel(0)
    window.addEventListener('resize', handleResize)

    const shell = shellRef.current
    const rightColumn = rightColumnRef.current
    const generation = `${layoutKey}:${isPlayerFullscreen}:${isLandscapeCompact}:${isDesktop}`
    if (!shell || !rightColumn || !isPlayerFullscreen || isDesktop || !isLandscapeCompact) {
      measureGenerationRef.current = generation
      setDensityLevel(0)
      return () => window.removeEventListener('resize', handleResize)
    }

    if (measureGenerationRef.current !== generation) {
      measureGenerationRef.current = generation
      if (densityLevel !== 0) {
        setDensityLevel(0)
        return () => window.removeEventListener('resize', handleResize)
      }
    }

    const evaluate = () => {
      if (!shell.classList.contains('fullscreen') || !isLandscapeCompact) {
        return
      }
      if (rightColumnContentOverflows(rightColumn) && densityLevel < LANDSCAPE_DENSITY_MAX_LEVEL) {
        setDensityLevel((current) => Math.min(LANDSCAPE_DENSITY_MAX_LEVEL, current + 1) as LandscapeDensityLevel)
      }
    }

    evaluate()

    const resizeObserver = new ResizeObserver(evaluate)
    resizeObserver.observe(shell)
    resizeObserver.observe(rightColumn)
    observeRightColumnChildren(resizeObserver, rightColumn)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [densityLevel, isDesktop, isLandscapeCompact, isPlayerFullscreen, layoutKey, rightColumnRef, shellRef])

  return densityLevel
}
