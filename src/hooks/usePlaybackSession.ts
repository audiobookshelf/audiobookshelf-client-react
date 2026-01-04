import { closePlaybackSession, startPlaybackSession, syncPlaybackSession } from '@/app/actions/playbackActions'
import { AudioTrack } from '@/lib/player/AudioTrack'
import { FIRST_SYNC_DELAY, SUBSEQUENT_SYNC_INTERVAL } from '@/lib/player/constants'
import type { LibraryItem, PlaybackSession, StartSessionPayload } from '@/types/api'
import { PlayMethod } from '@/types/api'
import { useCallback, useRef } from 'react'

// Generate or retrieve a persistent device ID
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'

  let deviceId = localStorage.getItem('absDeviceId')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('absDeviceId', deviceId)
  }
  return deviceId
}

interface UsePlaybackSessionOptions {
  /** Callback when session is ready */
  onSessionReady?: (session: PlaybackSession, audioTracks: AudioTrack[], isHlsTranscode: boolean) => void
  /** Callback on session error */
  onError?: (error: Error) => void
  /** Get current playback time */
  getCurrentTime?: () => number
}

interface UsePlaybackSessionReturn {
  /** Start a new playback session */
  startSession: (libraryItem: LibraryItem, supportedMimeTypes: string[], episodeId?: string, startTimeOverride?: number) => Promise<PlaybackSession | null>
  /** Sync progress to server */
  syncProgress: (currentTime: number) => void
  /** Close the current session */
  closeSession: (getCurrentTime?: () => number) => Promise<void>
  /** Start the sync interval (call when playback starts) */
  startSyncInterval: (getCurrentTime: () => number) => void
  /** Stop the sync interval (call when playback stops) */
  stopSyncInterval: () => void
  /** Get the current session ID */
  getSessionId: () => string | null
}

/**
 * Hook for managing playback sessions with the server
 * Handles session lifecycle: start, sync progress, and close
 */
export function usePlaybackSession(options: UsePlaybackSessionOptions = {}): UsePlaybackSessionReturn {
  const { onSessionReady, onError } = options

  // Session state (using refs to avoid re-renders on internal state changes)
  const sessionRef = useRef<PlaybackSession | null>(null)
  const lastSyncTimeRef = useRef(0)
  const listeningTimeSinceSync = useRef(0)
  const failedSyncsRef = useRef(0)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickRef = useRef(Date.now())

  const getSessionId = useCallback(() => {
    return sessionRef.current?.id ?? null
  }, [])

  /**
   * Start a new playback session
   */
  const startSession = useCallback(
    async (libraryItem: LibraryItem, supportedMimeTypes: string[], episodeId?: string, startTimeOverride?: number): Promise<PlaybackSession | null> => {
      try {
        const payload: StartSessionPayload = {
          deviceInfo: {
            clientName: 'Audiobookshelf Web (React)',
            deviceId: getDeviceId()
          },
          supportedMimeTypes,
          mediaPlayer: 'html5',
          forceTranscode: false,
          forceDirectPlay: false
        }

        const session = await startPlaybackSession(libraryItem.id, payload, episodeId)

        if (!session) {
          throw new Error('Failed to start playback session')
        }

        sessionRef.current = session
        lastSyncTimeRef.current = 0
        listeningTimeSinceSync.current = 0
        failedSyncsRef.current = 0

        // Determine if this is an HLS transcode or direct play
        const isHlsTranscode = session.playMethod !== PlayMethod.DIRECT_PLAY

        // Create AudioTrack instances from session data
        const audioTracks = session.audioTracks.map((track) => new AudioTrack(track, session.id))

        // Calculate start time (override if provided, otherwise use session's current time)
        const startTime = startTimeOverride ?? session.currentTime

        // Notify caller
        onSessionReady?.(
          {
            ...session,
            currentTime: startTime
          },
          audioTracks,
          isHlsTranscode
        )

        return session
      } catch (error) {
        console.error('[usePlaybackSession] Failed to start session:', error)
        onError?.(error instanceof Error ? error : new Error('Unknown error'))
        return null
      }
    },
    [onSessionReady, onError]
  )

  /**
   * Sync progress to server (debounced by minimum diff)
   */
  const syncProgress = useCallback(
    async (currentTime: number) => {
      const session = sessionRef.current
      if (!session) return

      // Skip if time hasn't changed enough
      const diffSinceLastSync = Math.abs(lastSyncTimeRef.current - currentTime)
      if (diffSinceLastSync < 1) return

      lastSyncTimeRef.current = currentTime
      const timeListened = Math.max(0, Math.floor(listeningTimeSinceSync.current))
      listeningTimeSinceSync.current = 0

      try {
        await syncPlaybackSession(session.id, {
          currentTime,
          timeListened
        })
        failedSyncsRef.current = 0
      } catch (error) {
        console.error('[usePlaybackSession] Sync failed:', error)
        failedSyncsRef.current++

        // After 4 failed syncs, notify the user
        if (failedSyncsRef.current >= 4) {
          onError?.(new Error('Failed to sync playback progress'))
          failedSyncsRef.current = 0
        }
      }
    },
    [onError]
  )

  /**
   * Start the sync interval
   */
  const startSyncInterval = useCallback(
    (getCurrentTime: () => number) => {
      // Clear any existing interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }

      lastTickRef.current = Date.now()

      syncIntervalRef.current = setInterval(() => {
        if (!sessionRef.current) return

        // Calculate elapsed time since last tick
        const now = Date.now()
        const elapsed = (now - lastTickRef.current) / 1000
        lastTickRef.current = now

        listeningTimeSinceSync.current += elapsed

        // Determine sync threshold
        const syncThreshold = lastSyncTimeRef.current > 0 ? SUBSEQUENT_SYNC_INTERVAL : FIRST_SYNC_DELAY

        if (listeningTimeSinceSync.current >= syncThreshold) {
          const currentTime = getCurrentTime()
          syncProgress(currentTime)
        }
      }, 1000)
    },
    [syncProgress]
  )

  /**
   * Stop the sync interval
   */
  const stopSyncInterval = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
  }, [])

  /**
   * Close the current session
   */
  const closeSession = useCallback(
    async (getCurrentTime?: () => number) => {
      stopSyncInterval()

      const session = sessionRef.current
      if (!session) return

      try {
        // Prepare sync data if enough time has passed
        const timeListened = Math.max(0, Math.floor(listeningTimeSinceSync.current))
        let syncData = null

        // When opening player and quickly closing, dont save progress
        if (timeListened > FIRST_SYNC_DELAY && getCurrentTime) {
          syncData = {
            currentTime: getCurrentTime(),
            timeListened
          }
        }

        await closePlaybackSession(session.id, syncData)
      } catch (error) {
        console.error('[usePlaybackSession] Failed to close session:', error)
      } finally {
        sessionRef.current = null
        lastSyncTimeRef.current = 0
        listeningTimeSinceSync.current = 0
      }
    },
    [stopSyncInterval]
  )

  return {
    startSession,
    syncProgress,
    closeSession,
    startSyncInterval,
    stopSyncInterval,
    getSessionId
  }
}
