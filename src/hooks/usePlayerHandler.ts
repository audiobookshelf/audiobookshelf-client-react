import { usePlaybackSession } from '@/hooks/usePlaybackSession'
import { usePlayerSettings, type PlayerSettings, type UsePlayerSettingsReturn } from '@/hooks/usePlayerSettings'
import { AudioTrack } from '@/lib/player/AudioTrack'
import { LocalAudioPlayer } from '@/lib/player/LocalAudioPlayer'
import type { Chapter, LibraryItem, PlaybackSession, PlayMethod } from '@/types/api'
import { PlayerState } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface PlayerHandlerState {
  /** Current player state */
  playerState: PlayerState
  /** Current playback time in seconds */
  currentTime: number
  /** Total duration in seconds */
  duration: number
  /** Buffered time in seconds */
  bufferedTime: number
  /** Current volume (0-1) */
  volume: number
  /** Whether using HLS transcode */
  isHlsTranscode: boolean
  /** Current play method */
  playMethod: PlayMethod | null
  /** Active session ID */
  sessionId: string | null
  /** Display title from session */
  displayTitle: string | null
  /** Display author from session */
  displayAuthor: string | null
  /** Current chapters */
  chapters: Chapter[]
  /** Current chapter */
  currentChapter: Chapter | null
  /** Next chapter */
  nextChapter: Chapter | null
  /** Previous chapter */
  previousChapter: Chapter | null
  /** Player settings (persisted in local storage) */
  settings: PlayerSettings
}

export interface PlayerHandlerControls {
  /** Load and start playing a library item */
  load: (libraryItem: LibraryItem, episodeId?: string | null, startTimeOverride?: number) => Promise<void>
  /** Play */
  play: () => void
  /** Pause */
  pause: () => void
  /** Toggle play/pause */
  playPause: () => void
  /** Seek to a specific time */
  seek: (time: number) => void
  /** Jump forward by configured amount */
  jumpForward: () => void
  /** Jump backward by configured amount */
  jumpBackward: () => void
  /** Set volume (0-1) */
  setVolume: (volume: number) => void
  /** Set playback rate (also updates player settings) */
  setPlaybackRate: (rate: number) => void
  /** Increment playback rate by configured amount */
  incrementPlaybackRate: () => void
  /** Decrement playback rate by configured amount */
  decrementPlaybackRate: () => void
  /** Update player settings */
  updateSettings: UsePlayerSettingsReturn['updateSettings']
  /** Close the player and end session */
  closePlayer: () => Promise<void>
}

export interface UsePlayerHandlerReturn {
  state: PlayerHandlerState
  controls: PlayerHandlerControls
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that manages the audio player and playback sessions.
 * This is the main orchestrator for audio playback - it instantiates
 * the LocalAudioPlayer and coordinates with the server for session management.
 */
export function usePlayerHandler(): UsePlayerHandlerReturn {
  // Player settings (persisted in local storage)
  const playerSettings = usePlayerSettings()
  const { settings } = playerSettings

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isHlsTranscode, setIsHlsTranscode] = useState(false)
  const [playMethod, setPlayMethod] = useState<PlayMethod | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [displayTitle, setDisplayTitle] = useState<string | null>(null)
  const [displayAuthor, setDisplayAuthor] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  // Refs
  const playerRef = useRef<LocalAudioPlayer | null>(null)
  const audioTracksRef = useRef<AudioTrack[]>([])
  const libraryItemRef = useRef<LibraryItem | null>(null)

  // Refs for values needed in callbacks (to avoid stale closures)
  const playbackRateRef = useRef(settings.playbackRate)
  playbackRateRef.current = settings.playbackRate

  const currentChapter = chapters.find((chapter) => chapter.start <= currentTime && chapter.end > currentTime) ?? null
  const nextChapter = chapters.find((chapter) => chapter.start > currentTime && chapter.end > currentTime) ?? null
  const previousChapter = chapters.findLast((chapter) => chapter.end <= currentTime && chapter.start < currentTime) ?? null

  // ============================================================================
  // Session Management
  // ============================================================================

  const handleSessionReady = useCallback((session: PlaybackSession, audioTracks: AudioTrack[], hlsTranscode: boolean) => {
    setSessionId(session.id)
    setDisplayTitle(session.displayTitle)
    setDisplayAuthor(session.displayAuthor)
    setChapters(
      (session.chapters ?? []).map((chapter) => {
        const start = parseFloat((chapter.start ?? 0).toFixed(6))
        const end = parseFloat((chapter.end ?? 0).toFixed(6))
        return {
          ...chapter,
          start,
          end
        }
      })
    )
    setPlayMethod(session.playMethod)
    setIsHlsTranscode(hlsTranscode)
    setDuration(session.duration)

    audioTracksRef.current = audioTracks

    // Start playback
    const item = libraryItemRef.current
    if (playerRef.current && item) {
      playerRef.current.set(item, audioTracks, hlsTranscode, session.currentTime, true)
    }
  }, [])

  const handleSessionError = useCallback((error: Error) => {
    console.error('[usePlayerHandler] Session error:', error)
    setPlayerState(PlayerState.ERROR)
  }, [])

  const { startSession, closeSession, startSyncInterval, stopSyncInterval } = usePlaybackSession({
    onSessionReady: handleSessionReady,
    onError: handleSessionError
  })

  // ============================================================================
  // Player Setup
  // ============================================================================

  const setupPlayerListeners = useCallback(
    (player: LocalAudioPlayer) => {
      player.on('stateChange', (state) => {
        setPlayerState(state)

        if (state === PlayerState.PLAYING) {
          // Start sync interval when playing
          startSyncInterval(() => playerRef.current?.getCurrentTime() ?? 0)
          // Apply playback rate from ref to avoid stale closure
          player.setPlaybackRate(playbackRateRef.current)
        } else {
          stopSyncInterval()
        }

        // Update current time on state changes
        if (state !== PlayerState.LOADING) {
          setCurrentTime(player.getCurrentTime())
        }

        // Update duration when loaded
        if (state === PlayerState.LOADED || state === PlayerState.PLAYING) {
          setDuration(player.getDuration())
        }
      })

      player.on('timeupdate', (time) => {
        setCurrentTime(time)
      })

      player.on('buffertimeUpdate', (time) => {
        setBufferedTime(time)
      })

      player.on('durationChange', (dur) => {
        setDuration(dur)
      })

      player.on('error', (error) => {
        console.error('[usePlayerHandler] Player error:', error)
        // TODO: Try switching to HLS transcode on error
      })

      player.on('finished', () => {
        // TODO: Handle media finished - move to next queue item or close
        console.log('[usePlayerHandler] Playback finished')
      })
    },
    [startSyncInterval, stopSyncInterval]
  )

  // Time update interval for smoother progress updates during playback
  useEffect(() => {
    if (playerState !== PlayerState.PLAYING) return

    const interval = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime())
      }
    }, 250) // Update 4 times per second for smooth UI

    return () => clearInterval(interval)
  }, [playerState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

  // ============================================================================
  // Controls
  // ============================================================================

  const load = useCallback(
    async (libraryItem: LibraryItem, episodeId?: string | null, startTimeOverride?: number) => {
      // Close existing session if any
      if (sessionId) {
        stopSyncInterval()
        await closeSession(() => playerRef.current?.getCurrentTime() ?? 0)
      }

      // Store reference to library item
      libraryItemRef.current = libraryItem
      setPlayerState(PlayerState.LOADING)

      // Initialize player if needed
      if (!playerRef.current) {
        playerRef.current = new LocalAudioPlayer()
        setupPlayerListeners(playerRef.current)
      }

      // Start session - this will trigger handleSessionReady which starts playback
      await startSession(libraryItem, playerRef.current.playableMimeTypes, episodeId ?? undefined, startTimeOverride)
    },
    [sessionId, closeSession, stopSyncInterval, setupPlayerListeners, startSession]
  )

  const play = useCallback(() => {
    playerRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pause()
  }, [])

  const playPause = useCallback(() => {
    playerRef.current?.playPause()
  }, [])

  const seek = useCallback(
    (time: number) => {
      if (!playerRef.current) return
      const isPlaying = playerState === PlayerState.PLAYING
      playerRef.current.seek(time, isPlaying)
      setCurrentTime(time)
    },
    [playerState]
  )

  const jumpForward = useCallback(() => {
    if (!playerRef.current) return
    const newTime = Math.min(currentTime + settings.jumpForwardAmount, duration)
    seek(newTime)
  }, [currentTime, duration, seek, settings.jumpForwardAmount])

  const jumpBackward = useCallback(() => {
    if (!playerRef.current) return
    const newTime = Math.max(currentTime - settings.jumpBackwardAmount, 0)
    seek(newTime)
  }, [currentTime, seek, settings.jumpBackwardAmount])

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol)
    playerRef.current?.setVolume(vol)
  }, [])

  const setPlaybackRate = useCallback(
    (rate: number) => {
      playerSettings.setPlaybackRate(rate)
      playerRef.current?.setPlaybackRate(rate)
    },
    [playerSettings]
  )

  const incrementPlaybackRate = useCallback(() => {
    const newRate = playerSettings.incrementPlaybackRate()
    playerRef.current?.setPlaybackRate(newRate)
  }, [playerSettings])

  const decrementPlaybackRate = useCallback(() => {
    const newRate = playerSettings.decrementPlaybackRate()
    playerRef.current?.setPlaybackRate(newRate)
  }, [playerSettings])

  const closePlayer = useCallback(async () => {
    stopSyncInterval()
    await closeSession(() => playerRef.current?.getCurrentTime() ?? 0)

    // Destroy player
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    // Reset state
    setPlayerState(PlayerState.IDLE)
    setCurrentTime(0)
    setDuration(0)
    setBufferedTime(0)
    setSessionId(null)
    setDisplayTitle(null)
    setDisplayAuthor(null)
    setChapters([])
    setPlayMethod(null)
    setIsHlsTranscode(false)
    audioTracksRef.current = []
    libraryItemRef.current = null
  }, [closeSession, stopSyncInterval])

  return {
    state: {
      playerState,
      currentTime,
      duration,
      bufferedTime,
      volume,
      isHlsTranscode,
      playMethod,
      sessionId,
      displayTitle,
      displayAuthor,
      chapters,
      currentChapter,
      nextChapter,
      previousChapter,
      settings
    },
    controls: {
      load,
      play,
      pause,
      playPause,
      seek,
      jumpForward,
      jumpBackward,
      setVolume,
      setPlaybackRate,
      incrementPlaybackRate,
      decrementPlaybackRate,
      updateSettings: playerSettings.updateSettings,
      closePlayer
    }
  }
}
