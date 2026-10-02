'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export interface PlayerShellLayout {
  isPlayerFullscreen: boolean
  /** Fullscreen and a short landscape viewport (`orientation: landscape` and `max-height: 600px`). */
  isLandscapeCompact: boolean
}

/**
 * Player shell layout modes shared by shell sections. `isLandscapeCompact` is already gated on fullscreen.
 */
export function usePlayerShellLayout(): PlayerShellLayout {
  const { isPlayerFullscreen } = useMediaContext()
  const isLandscapeCompactViewport = useMediaQuery('landscape-compact')
  return {
    isPlayerFullscreen,
    isLandscapeCompact: isPlayerFullscreen && isLandscapeCompactViewport
  }
}
