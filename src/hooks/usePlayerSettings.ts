import { useCallback, useEffect, useState } from 'react'

export interface PlayerSettings {
  /** Track shows chapter instead of full duration */
  useChapterTrack: boolean
  /** Seconds to jump forward */
  jumpForwardAmount: number
  /** Seconds to jump backward */
  jumpBackwardAmount: number
  /** Current playback rate (e.g., 1.0, 1.5, 2.0) */
  playbackRate: number
  /** Increment/decrement amount for playback rate changes (0.1 or 0.05) */
  playbackRateIncrementDecrement: 0.1 | 0.05
}

export interface UsePlayerSettingsReturn {
  settings: PlayerSettings
  setUseChapterTrack: (value: boolean) => void
  setJumpForwardAmount: (value: number) => void
  setJumpBackwardAmount: (value: number) => void
  setPlaybackRate: (value: number) => void
  setPlaybackRateIncrementDecrement: (value: 0.1 | 0.05) => void
  /** Update multiple settings at once */
  updateSettings: (updates: Partial<PlayerSettings>) => void
  /** Increment playback rate by the configured increment amount */
  incrementPlaybackRate: () => number
  /** Decrement playback rate by the configured decrement amount */
  decrementPlaybackRate: () => number
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'absPlayerSettings'

const DEFAULT_SETTINGS: PlayerSettings = {
  useChapterTrack: false,
  jumpForwardAmount: 10,
  jumpBackwardAmount: 10,
  playbackRate: 1.0,
  playbackRateIncrementDecrement: 0.1
}

// Playback rate bounds
const MIN_PLAYBACK_RATE = 0.5
const MAX_PLAYBACK_RATE = 10.0

// ============================================================================
// Helper Functions
// ============================================================================

function loadSettingsFromStorage(): PlayerSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_SETTINGS
    }

    const parsed = JSON.parse(stored) as Partial<PlayerSettings>

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Ensure playbackRateIncrementDecrement is valid
      playbackRateIncrementDecrement:
        parsed.playbackRateIncrementDecrement === 0.05 || parsed.playbackRateIncrementDecrement === 0.1
          ? parsed.playbackRateIncrementDecrement
          : DEFAULT_SETTINGS.playbackRateIncrementDecrement
    }
  } catch (error) {
    console.error('[usePlayerSettings] Failed to load settings from localStorage:', error)
    return DEFAULT_SETTINGS
  }
}

function saveSettingsToStorage(settings: PlayerSettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('[usePlayerSettings] Failed to save settings to localStorage:', error)
  }
}

/**
 * Clamp playback rate to valid bounds and round to avoid floating point issues
 */
function clampPlaybackRate(rate: number): number {
  const clamped = Math.max(MIN_PLAYBACK_RATE, Math.min(MAX_PLAYBACK_RATE, rate))
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(clamped * 100) / 100
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that manages player settings persisted in local storage.
 * Settings include playback rate, jump amounts, chapter track mode, etc.
 */
export function usePlayerSettings(): UsePlayerSettingsReturn {
  const [settings, setSettings] = useState<PlayerSettings>(DEFAULT_SETTINGS)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings from localStorage on mount (client-side only)
  useEffect(() => {
    const loaded = loadSettingsFromStorage()
    setSettings(loaded)
    setIsInitialized(true)
  }, [])

  // Save settings to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (isInitialized) {
      saveSettingsToStorage(settings)
    }
  }, [settings, isInitialized])

  const updateSettings = useCallback((updates: Partial<PlayerSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates
    }))
  }, [])

  const setUseChapterTrack = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, useChapterTrack: value }))
  }, [])

  const setJumpForwardAmount = useCallback((value: number) => {
    setSettings((prev) => ({ ...prev, jumpForwardAmount: value }))
  }, [])

  const setJumpBackwardAmount = useCallback((value: number) => {
    setSettings((prev) => ({ ...prev, jumpBackwardAmount: value }))
  }, [])

  const setPlaybackRate = useCallback((value: number) => {
    setSettings((prev) => ({ ...prev, playbackRate: clampPlaybackRate(value) }))
  }, [])

  const setPlaybackRateIncrementDecrement = useCallback((value: 0.1 | 0.05) => {
    setSettings((prev) => ({ ...prev, playbackRateIncrementDecrement: value }))
  }, [])

  const incrementPlaybackRate = useCallback((): number => {
    let newRate: number = settings.playbackRate
    setSettings((prev) => {
      newRate = clampPlaybackRate(prev.playbackRate + prev.playbackRateIncrementDecrement)
      return { ...prev, playbackRate: newRate }
    })
    return newRate
  }, [settings.playbackRate])

  const decrementPlaybackRate = useCallback((): number => {
    let newRate: number = settings.playbackRate
    setSettings((prev) => {
      newRate = clampPlaybackRate(prev.playbackRate - prev.playbackRateIncrementDecrement)
      return { ...prev, playbackRate: newRate }
    })
    return newRate
  }, [settings.playbackRate])

  return {
    settings,
    setUseChapterTrack,
    setJumpForwardAmount,
    setJumpBackwardAmount,
    setPlaybackRate,
    setPlaybackRateIncrementDecrement,
    updateSettings,
    incrementPlaybackRate,
    decrementPlaybackRate
  }
}
