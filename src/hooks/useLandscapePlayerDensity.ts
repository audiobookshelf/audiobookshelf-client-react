'use client'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { landscapeDensityFromShell, type LandscapeDensityFlags } from '@/lib/player/landscapeDensity'
import { RefObject, useLayoutEffect, useState } from 'react'

const FULL_LANDSCAPE_UI: LandscapeDensityFlags = {
  overflowSecondaryToolbar: false,
  singleTrackBar: false,
  chapterLabelBelow: false,
  compactTitle: false
}

function sameDensity(left: LandscapeDensityFlags, right: LandscapeDensityFlags) {
  const keys = Object.keys(left) as (keyof LandscapeDensityFlags)[]
  return keys.every((key) => left[key] === right[key])
}

export function useLandscapePlayerDensity(shellRef: RefObject<HTMLElement | null>, chapterTrack: boolean, hasChapters: boolean): LandscapeDensityFlags {
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const isDesktop = useMediaQuery('lg')
  const landscapeActive = isPlayerFullscreen && isLandscapeCompact && !isDesktop
  const [density, setDensity] = useState(FULL_LANDSCAPE_UI)

  useLayoutEffect(() => {
    if (!landscapeActive) return

    const measure = () => {
      const shell = shellRef.current
      setDensity(shell ? landscapeDensityFromShell(shell, chapterTrack, hasChapters) : FULL_LANDSCAPE_UI)
    }
    // The render-time read can run before the fullscreen class (and its column tokens) is committed.
    measure()
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [chapterTrack, hasChapters, landscapeActive, shellRef])

  const shell = shellRef.current
  const measured = landscapeActive && shell ? landscapeDensityFromShell(shell, chapterTrack, hasChapters) : FULL_LANDSCAPE_UI
  if (!sameDensity(measured, density)) setDensity(measured)

  return density
}
