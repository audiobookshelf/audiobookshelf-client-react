'use client'

import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { LANDSCAPE_DENSITY_MAX_LEVEL, rightColumnContentOverflows, type LandscapeDensityLevel } from '@/lib/player/landscapeDensity'
import { RefObject, useLayoutEffect, useState } from 'react'

function observeRightColumnChildren(resizeObserver: ResizeObserver, rightColumn: HTMLElement) {
  for (const child of rightColumn.children) {
    resizeObserver.observe(child)
  }
}

export function useLandscapePlayerDensity(
  shellRef: RefObject<HTMLDivElement | null>,
  rightColumnRef: RefObject<HTMLDivElement | null>,
  isDesktop: boolean,
  layoutKey: string
): LandscapeDensityLevel {
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const [densityLevel, setDensityLevel] = useState<LandscapeDensityLevel>(0)

  useLayoutEffect(() => {
    const handleResize = () => setDensityLevel(0)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [layoutKey, isPlayerFullscreen, isDesktop])

  useLayoutEffect(() => {
    const shell = shellRef.current
    const rightColumn = rightColumnRef.current
    if (!shell || !rightColumn || !isPlayerFullscreen || isDesktop || !isLandscapeCompact) {
      return
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

    window.addEventListener('resize', evaluate)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', evaluate)
    }
  }, [densityLevel, isDesktop, isLandscapeCompact, isPlayerFullscreen, layoutKey, rightColumnRef, shellRef])

  return densityLevel
}
