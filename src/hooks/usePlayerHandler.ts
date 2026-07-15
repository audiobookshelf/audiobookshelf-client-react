import { subscribeCastSessionActive } from '@/contexts/ChromecastContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { usePlaybackSession, type StartSessionOptions } from '@/hooks/usePlaybackSession'
import { usePlayerSettings, type PlayerSettings, type UsePlayerSettingsReturn } from '@/hooks/usePlayerSettings'
import { AudioTrack } from '@/lib/player/AudioTrack'
import { CastPlayer } from '@/lib/player/CastPlayer'
import { getCastRemotePlayerHandles } from '@/lib/player/chromecastConstants'
import { LocalAudioPlayer } from '@/lib/player/LocalAudioPlayer'
import { computeTranscodePercentReady } from '@/lib/player/streamProgressUtils'
import type { Chapter, LibraryItem, PlaybackSession, PlayMethod, StreamProgressPayload } from '@/types/api'
import { PlayerState } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type PlayerBackend = LocalAudioPlayer | CastPlayer
type PlayerKind = 'local' | 'cast'

function createPlayerInstance(kind: PlayerKind): PlayerBackend {
  if (kind === 'cast') {
    const handles = getCastRemotePlayerHandles()
    if (!handles) {
      console.warn('[usePlayerHandler] Cast remote player unavailable, falling back to local player')
      return new LocalAudioPlayer()
    }
    return new CastPlayer(handles)
  }
  return new LocalAudioPlayer()
}

function getSessionOptions(kind: PlayerKind): StartSessionOptions {
  return {
    mediaPlayer: kind === 'cast' ? 'chromecast' : 'html5',
    forceDirectPlay: kind === 'cast'
  }
}

interface UsePlayerHandlerOptions {
  isCasting?: boolean
}

export interface PlayerHandlerState {
  /** Current player state */
  playerState: PlayerState
  /** Current playback time in seconds */
  currentTime: number
  /** Total duration in seconds */
  duration: number
  /** Buffered time in seconds */
  bufferedTime: number
  /** HLS transcode segments ready on server (0–1); direct play stays at 1 */
  transcodePercentReady: number
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
  /** Toggle mute on/off */
  toggleMute: () => void
  /** Set playback rate */
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

export interface PlayerHandler {
  state: PlayerHandlerState
  controls: PlayerHandlerControls
}

export interface UsePlayerHandlerReturn extends PlayerHandler {
  /** Register a handler for when the current item finishes (updated via useEffect in callers). */
  setOnPlaybackFinished: (handler: (() => void) | undefined) => void
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that manages the audio player and playback sessions.
 * This is the main orchestrator for audio playback - it instantiates
 * the LocalAudioPlayer or CastPlayer and coordinates with the server for session management.
 */
export function usePlayerHandler(options: UsePlayerHandlerOptions = {}): UsePlayerHandlerReturn {
  const isCastingRef = useRef(options.isCasting ?? false)
  isCastingRef.current = options.isCasting ?? false

  const onPlaybackFinishedRef = useRef<(() => void) | undefined>(undefined)

  const setOnPlaybackFinished = useCallback((handler: (() => void) | undefined) => {
    onPlaybackFinishedRef.current = handler
  }, [])
  // Player settings (persisted in local storage)
  const {
    settings,
    setVolume: setPersistedVolume,
    toggleMute: togglePersistedMute,
    setPlaybackRate: setPersistedPlaybackRate,
    incrementPlaybackRate: incrementPersistedPlaybackRate,
    decrementPlaybackRate: decrementPersistedPlaybackRate,
    updateSettings
  } = usePlayerSettings()

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [transcodePercentReady, setTranscodePercentReady] = useState(1)
  const [isHlsTranscode, setIsHlsTranscode] = useState(false)
  const isHlsTranscodeRef = useRef(false)
  isHlsTranscodeRef.current = isHlsTranscode
  const [playMethod, setPlayMethod] = useState<PlayMethod | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [displayTitle, setDisplayTitle] = useState<string | null>(null)
  const [displayAuthor, setDisplayAuthor] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  // Refs
  const playerRef = useRef<PlayerBackend | null>(null)
  const playerKindRef = useRef<PlayerKind>('local')
  const audioTracksRef = useRef<AudioTrack[]>([])
  const libraryItemRef = useRef<LibraryItem | null>(null)
  const episodeIdRef = useRef<string | null>(null)

  // Refs for values needed in callbacks (to avoid stale closures)
  const playbackRateRef = useRef(settings.playbackRate)
  playbackRateRef.current = settings.playbackRate

  const volumeRef = useRef(settings.volume)
  volumeRef.current = settings.volume

  const playerStateRef = useRef(playerState)
  playerStateRef.current = playerState

  const jumpForwardAmountRef = useRef(settings.jumpForwardAmount)
  jumpForwardAmountRef.current = settings.jumpForwardAmount

  const jumpBackwardAmountRef = useRef(settings.jumpBackwardAmount)
  jumpBackwardAmountRef.current = settings.jumpBackwardAmount

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
    isHlsTranscodeRef.current = hlsTranscode
    setIsHlsTranscode(hlsTranscode)
    setTranscodePercentReady(hlsTranscode ? 0 : 1)
    setDuration(session.duration)

    audioTracksRef.current = audioTracks

    const item = libraryItemRef.current
    const player = playerRef.current
    if (!player || !item) return

    void (async () => {
      if (playerKindRef.current === 'cast') {
        await player.set(item, audioTracks, hlsTranscode, session.currentTime, true)
      } else {
        player.set(item, audioTracks, hlsTranscode, session.currentTime, true)
      }
    })()
  }, [])

  const handleSessionError = useCallback((error: Error) => {
    console.error('[usePlayerHandler] Session error:', error)
    setPlayerState(PlayerState.ERROR)
  }, [])

  const { startSession, closeSession, syncProgress, startSyncInterval, stopSyncInterval, getSessionId } = usePlaybackSession({
    onSessionReady: handleSessionReady,
    onError: handleSessionError
  })

  const syncProgressRef = useRef(syncProgress)
  syncProgressRef.current = syncProgress

  const handleStreamProgress = useCallback(
    (data: StreamProgressPayload) => {
      if (playerKindRef.current !== 'local' || !isHlsTranscodeRef.current) return
      if (getSessionId() !== data.stream || !data.numSegments) return

      setTranscodePercentReady(computeTranscodePercentReady(data.chunks, data.numSegments))
    },
    [getSessionId]
  )

  const handleStreamReady = useCallback(() => {
    if (playerKindRef.current !== 'local' || !isHlsTranscodeRef.current) return
    setTranscodePercentReady(1)
  }, [])

  useSocketEvent<StreamProgressPayload>('stream_progress', handleStreamProgress, [handleStreamProgress])
  useSocketEvent('stream_ready', handleStreamReady, [handleStreamReady])

  const isRetryingTranscodeRef = useRef(false)
  const retryWithForceTranscodeRef = useRef<() => Promise<void>>(async () => {})

  retryWithForceTranscodeRef.current = async () => {
    const item = libraryItemRef.current
    const player = playerRef.current
    if (!item || !player) return
    if (playerKindRef.current !== 'local' || isCastingRef.current) return
    if (isHlsTranscodeRef.current || isRetryingTranscodeRef.current) return

    isRetryingTranscodeRef.current = true

    try {
      console.log('[usePlayerHandler] Audio player error switching to HLS stream')

      const resumeTime = player.getCurrentTime()
      stopSyncInterval()

      if (getSessionId()) {
        await closeSession(() => resumeTime)
      }

      setPlayerState(PlayerState.LOADING)

      await startSession(item, player.playableMimeTypes, episodeIdRef.current ?? undefined, undefined, {
        ...getSessionOptions('local'),
        forceTranscode: true
      })
    } finally {
      isRetryingTranscodeRef.current = false
    }
  }

  // ============================================================================
  // Player Setup
  // ============================================================================

  const setupPlayerListeners = useCallback(
    (player: PlayerBackend) => {
      player.on('stateChange', (state) => {
        setPlayerState(state)

        if (state === PlayerState.PLAYING) {
          // Start sync interval when playing
          startSyncInterval(() => playerRef.current?.getCurrentTime() ?? 0)
          // Apply playback rate and volume from refs to avoid stale closures
          player.setPlaybackRate(playbackRateRef.current)
          player.setVolume(volumeRef.current)
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

      player.on('buffertimeUpdate', (time) => {
        setBufferedTime(time)
      })

      player.on('durationChange', (dur) => {
        setDuration(dur)
      })

      player.on('error', (error) => {
        console.error('[usePlayerHandler] Player error:', error)
        void retryWithForceTranscodeRef.current()
      })

      player.on('finished', () => {
        void (async () => {
          stopSyncInterval()

          const player = playerRef.current
          if (!player) {
            onPlaybackFinishedRef.current?.()
            return
          }

          const duration = player.getDuration()
          const finalTime = duration > 0 ? duration : player.getCurrentTime()
          setCurrentTime(finalTime)
          await syncProgressRef.current(finalTime, { force: true })
          onPlaybackFinishedRef.current?.()
        })()
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

  const switchPlayer = useCallback(
    async (targetKind: PlayerKind) => {
      const item = libraryItemRef.current
      if (!item) return

      const resumeTime = playerRef.current?.getCurrentTime() ?? 0
      const episodeId = episodeIdRef.current

      stopSyncInterval()
      if (getSessionId()) {
        await closeSession(() => playerRef.current?.getCurrentTime() ?? resumeTime)
      }

      playerRef.current?.destroy()
      playerRef.current = null

      setPlayerState(PlayerState.LOADING)

      const player = createPlayerInstance(targetKind)
      playerRef.current = player
      playerKindRef.current = targetKind
      setupPlayerListeners(player)

      await startSession(item, player.playableMimeTypes, episodeId ?? undefined, resumeTime, getSessionOptions(targetKind))
    },
    [closeSession, getSessionId, setupPlayerListeners, startSession, stopSyncInterval]
  )

  useEffect(() => {
    return subscribeCastSessionActive((isActive) => {
      if (!libraryItemRef.current) return

      queueMicrotask(() => {
        if (isActive && playerKindRef.current === 'local') {
          void switchPlayer('cast')
        } else if (!isActive && playerKindRef.current === 'cast') {
          void switchPlayer('local')
        }
      })
    })
  }, [switchPlayer])

  // ============================================================================
  // Controls
  // ============================================================================

  const load = useCallback(
    async (libraryItem: LibraryItem, episodeId?: string | null, startTimeOverride?: number) => {
      // Close existing session if any (use session ref, not React state, to avoid stale/double close)
      if (getSessionId()) {
        stopSyncInterval()
        await closeSession(() => playerRef.current?.getCurrentTime() ?? 0)
      }

      // Store reference to library item
      libraryItemRef.current = libraryItem
      episodeIdRef.current = episodeId ?? null
      setPlayerState(PlayerState.LOADING)
      isHlsTranscodeRef.current = false
      setIsHlsTranscode(false)
      setTranscodePercentReady(1)

      const targetKind: PlayerKind = isCastingRef.current && getCastRemotePlayerHandles() ? 'cast' : 'local'

      if (!playerRef.current || playerKindRef.current !== targetKind) {
        playerRef.current?.destroy()
        playerRef.current = createPlayerInstance(targetKind)
        playerKindRef.current = targetKind
        setupPlayerListeners(playerRef.current)
      }

      // Start session - this will trigger handleSessionReady which starts playback
      await startSession(libraryItem, playerRef.current.playableMimeTypes, episodeId ?? undefined, startTimeOverride, getSessionOptions(targetKind))
    },
    [closeSession, getSessionId, stopSyncInterval, setupPlayerListeners, startSession]
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

  const seek = useCallback((time: number) => {
    if (!playerRef.current) return
    const isPlaying = playerStateRef.current === PlayerState.PLAYING
    void Promise.resolve(playerRef.current.seek(time, isPlaying))
    setCurrentTime(time)
  }, [])

  const jumpForward = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    const newTime = Math.min(player.getCurrentTime() + jumpForwardAmountRef.current, player.getDuration())
    seek(newTime)
  }, [seek])

  const jumpBackward = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    const newTime = Math.max(player.getCurrentTime() - jumpBackwardAmountRef.current, 0)
    seek(newTime)
  }, [seek])

  const setVolume = useCallback(
    (vol: number) => {
      setPersistedVolume(vol)
      playerRef.current?.setVolume(vol)
    },
    [setPersistedVolume]
  )

  const toggleMute = useCallback(() => {
    const newVolume = togglePersistedMute()
    playerRef.current?.setVolume(newVolume)
  }, [togglePersistedMute])

  const setPlaybackRate = useCallback(
    (rate: number) => {
      setPersistedPlaybackRate(rate)
      playerRef.current?.setPlaybackRate(rate)
    },
    [setPersistedPlaybackRate]
  )

  const incrementPlaybackRate = useCallback(() => {
    const newRate = incrementPersistedPlaybackRate()
    playerRef.current?.setPlaybackRate(newRate)
  }, [incrementPersistedPlaybackRate])

  const decrementPlaybackRate = useCallback(() => {
    const newRate = decrementPersistedPlaybackRate()
    playerRef.current?.setPlaybackRate(newRate)
  }, [decrementPersistedPlaybackRate])

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
    setTranscodePercentReady(1)
    setSessionId(null)
    setDisplayTitle(null)
    setDisplayAuthor(null)
    setChapters([])
    setPlayMethod(null)
    isHlsTranscodeRef.current = false
    setIsHlsTranscode(false)
    audioTracksRef.current = []
    libraryItemRef.current = null
    episodeIdRef.current = null
    playerKindRef.current = 'local'
  }, [closeSession, stopSyncInterval])

  const controls = useMemo(
    (): PlayerHandlerControls => ({
      load,
      play,
      pause,
      playPause,
      seek,
      jumpForward,
      jumpBackward,
      setVolume,
      toggleMute,
      setPlaybackRate,
      incrementPlaybackRate,
      decrementPlaybackRate,
      updateSettings,
      closePlayer
    }),
    [
      load,
      play,
      pause,
      playPause,
      seek,
      jumpForward,
      jumpBackward,
      setVolume,
      toggleMute,
      setPlaybackRate,
      incrementPlaybackRate,
      decrementPlaybackRate,
      updateSettings,
      closePlayer
    ]
  )

  return {
    state: {
      playerState,
      currentTime,
      duration,
      bufferedTime,
      transcodePercentReady,
      volume: settings.volume,
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
    controls,
    setOnPlaybackFinished
  }
}
