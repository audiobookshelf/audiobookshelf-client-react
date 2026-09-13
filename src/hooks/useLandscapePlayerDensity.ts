'use client'

import { isLandscapeCompactViewport } from '@/lib/player/coverFit'
import { LANDSCAPE_DENSITY_MAX_LEVEL, rightColumnContentOverflows, type LandscapeDensityLevel } from '@/lib/player/landscapeDensity'
import { RefObject, useLayoutEffect, useState } from 'react'

function isLandscapePlayerMode(shell: HTMLElement, isDesktop: boolean): boolean {
  if (isDesktop) return false
  return isLandscapeCompactViewport(shell.clientWidth, shell.clientHeight)
}

function observeRightColumnChildren(resizeObserver: ResizeObserver, rightColumn: HTMLElement) {
  for (const child of rightColumn.children) {
    resizeObserver.observe(child)
  }
}

export function useLandscapePlayerDensity(
  shellRef: RefObject<HTMLDivElement | null>,
  rightColumnRef: RefObject<HTMLDivElement | null>,
  isPlayerFullscreen: boolean,
  isDesktop: boolean,
  layoutKey: string
): LandscapeDensityLevel {
  const [densityLevel, setDensityLevel] = useState<LandscapeDensityLevel>(0)

  useLayoutEffect(() => {
    const handleResize = () => setDensityLevel(0)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [layoutKey, isPlayerFullscreen, isDesktop])

  useLayoutEffect(() => {
    const shell = shellRef.current
    const rightColumn = rightColumnRef.current
    if (!shell || !rightColumn || !isPlayerFullscreen || isDesktop) {
      return
    }

    const evaluate = () => {
      if (!shell.classList.contains('fullscreen') || !isLandscapePlayerMode(shell, isDesktop)) {
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
  }, [densityLevel, isDesktop, isPlayerFullscreen, layoutKey, rightColumnRef, shellRef])

  return densityLevel
}
