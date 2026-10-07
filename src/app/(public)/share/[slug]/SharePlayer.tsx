'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { usePlayerSettings } from '@/hooks/usePlayerSettings'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { withBasePath } from '@/lib/basePath'
import { getCoverAspectRatio, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { AudioTrack } from '@/lib/player/AudioTrack'
import { LocalAudioPlayer } from '@/lib/player/LocalAudioPlayer'
import type { AudioTrackData, Chapter, MediaItemShareResponse } from '@/types/api'
import { PlayerState } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface SharePlayerProps {
  slug: string
  startTime?: number
}

const PROGRESS_SYNC_INTERVAL = 30 // seconds

export default function SharePlayer({ slug, startTime: startTimeParam }: SharePlayerProps) {
  const t = useTypeSafeTranslations()
  const unknownLabel = t('LabelUnknown')
  // Share data
  const [shareData, setShareData] = useState<MediaItemShareResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)

  // Viewport
  const [windowWidth, setWindowWidth] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)

  // Refs
  const playerRef = useRef<LocalAudioPlayer | null>(null)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listeningTimeSinceSync = useRef(0)
  const lastTickRef = useRef(Date.now())

  // Player settings (persisted in local storage)
  const playerSettings = usePlayerSettings()
  const { settings } = playerSettings

  // ============================================================================
  // Fetch share data
  // ============================================================================

  useEffect(() => {
    let cancelled = false

    async function fetchShareData() {
      try {
        let endpoint = withBasePath(`/public/share/${slug}`)
        if (startTimeParam != null) {
          endpoint += `?t=${startTimeParam}`
        }

        const response = await fetch(endpoint, { credentials: 'include' })
        if (!response.ok) {
          if (response.status === 404) {
            setFetchError('Media item not found or expired')
          } else {
            setFetchError(`Failed to load (${response.status})`)
          }
          return
        }

        const data: MediaItemShareResponse = await response.json()
        if (!cancelled) {
          setShareData(data)
        }
      } catch (err) {
        console.error('[SharePlayer] Failed to fetch share data:', err)
        if (!cancelled) {
          setFetchError('Failed to load shared item')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchShareData()
    return () => {
      cancelled = true
    }
  }, [slug, startTimeParam])

  // ============================================================================
  // Derived data
  // ============================================================================

  const playbackSession = shareData?.playbackSession ?? null
  const chapters = useMemo<Chapter[]>(() => playbackSession?.chapters ?? [], [playbackSession?.chapters])
  const isPlaying = playerState === PlayerState.PLAYING
  const hasLoaded = playerState !== PlayerState.IDLE && playerState !== PlayerState.LOADING
  const coverAspectRatio = getCoverAspectRatio(playbackSession?.coverAspectRatio)

  const coverUrl = playbackSession?.coverPath ? withBasePath(`/public/share/${slug}/cover`) : getPlaceholderCoverUrl()

  const downloadUrl = withBasePath(`/public/share/${slug}/download`)

  const audioTracks: AudioTrack[] = useMemo(() => {
    if (!playbackSession?.audioTracks) return []
    return playbackSession.audioTracks.map((track: AudioTrackData) => new AudioTrack(track))
  }, [playbackSession?.audioTracks])

  const currentChapter = useMemo(() => chapters.find((ch) => ch.start <= currentTime && currentTime < ch.end) ?? null, [chapters, currentTime])

  // Cover size calculations
  const isMobileLandscape = windowWidth > windowHeight && windowHeight < 450

  const coverWidth = useMemo(() => {
    const availableCoverWidth = Math.min(450, windowWidth - 32)
    const availableCoverHeight = Math.min(450, windowHeight - 250)
    const mostCoverHeight = availableCoverWidth * coverAspectRatio
    if (mostCoverHeight > availableCoverHeight) {
      return availableCoverHeight / coverAspectRatio
    }
    return availableCoverWidth
  }, [windowWidth, windowHeight, coverAspectRatio])

  const coverHeight = coverWidth * coverAspectRatio

  // Track bar calculations
  const playedPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0
  const bufferedPercent = duration ? Math.min(100, (bufferedTime / duration) * 100) : 0
  const timeRemaining = duration - currentTime
  const currentTimeFormatted = secondsToTimestamp(currentTime)
  const timeRemainingFormatted = timeRemaining < 0 ? secondsToTimestamp(timeRemaining * -1) : `-${secondsToTimestamp(timeRemaining)}`

  // ============================================================================
  // Progress sync
  // ============================================================================

  const sendProgressSync = useCallback(
    (time: number) => {
      fetch(withBasePath(`/public/share/${slug}/progress`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime: time }),
        credentials: 'include'
      }).catch((err) => console.error('[SharePlayer] Progress sync failed:', err))
    },
    [slug]
  )

  // ============================================================================
  // Play interval (time tracking + progress sync)
  // ============================================================================

  const startPlayInterval = useCallback(() => {
    if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    lastTickRef.current = Date.now()

    playIntervalRef.current = setInterval(() => {
      if (!playerRef.current) return
      const time = playerRef.current.getCurrentTime()
      setCurrentTime(time)

      const exactTimeElapsed = (Date.now() - lastTickRef.current) / 1000
      lastTickRef.current = Date.now()
      listeningTimeSinceSync.current += exactTimeElapsed
      if (listeningTimeSinceSync.current >= PROGRESS_SYNC_INTERVAL) {
        listeningTimeSinceSync.current = 0
        sendProgressSync(time)
      }
    }, 1000)
  }, [sendProgressSync])

  const stopPlayInterval = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
  }, [])

  // ============================================================================
  // Player setup
  // ============================================================================

  useEffect(() => {
    if (!shareData || !playbackSession || audioTracks.length === 0) return

    const player = new LocalAudioPlayer()
    playerRef.current = player

    player.on('stateChange', (state) => {
      setPlayerState(state)

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

    player.on('error', (error) => {
      console.error('[SharePlayer] Player error:', error)
    })

    player.on('finished', () => {
      console.log('[SharePlayer] Playback finished')
    })

    const sessionStartTime = playbackSession.currentTime || 0
    player.set(null, audioTracks, false, sessionStartTime, false)

    return () => {
      player.destroy()
      playerRef.current = null
    }
    // Only init player once when shareData/audioTracks become available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareData, audioTracks])

  // Manage play interval based on player state
  useEffect(() => {
    if (isPlaying) {
      startPlayInterval()
    } else {
      stopPlayInterval()
    }
    return stopPlayInterval
  }, [isPlaying, startPlayInterval, stopPlayInterval])

  // ============================================================================
  // Controls
  // ============================================================================

  const play = useCallback(() => {
    playerRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pause()
  }, [])

  const playPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const seek = useCallback(
    (time: number) => {
      if (!playerRef.current || !hasLoaded) return
      playerRef.current.seek(time, isPlaying)
      setCurrentTime(time)
    },
    [hasLoaded, isPlaying]
  )

  const jumpForward = useCallback(() => {
    if (!playerRef.current || !hasLoaded) return
    const time = playerRef.current.getCurrentTime()
    seek(Math.min(time + settings.jumpForwardAmount, duration))
  }, [hasLoaded, seek, settings.jumpForwardAmount, duration])

  const jumpBackward = useCallback(() => {
    if (!playerRef.current || !hasLoaded) return
    const time = playerRef.current.getCurrentTime()
    seek(Math.max(time - settings.jumpBackwardAmount, 0))
  }, [hasLoaded, seek, settings.jumpBackwardAmount])

  const setVolume = useCallback(
    (vol: number) => {
      playerSettings.setVolume(vol)
      playerRef.current?.setVolume(vol)
    },
    [playerSettings]
  )

  const setPlaybackRate = useCallback(
    (rate: number) => {
      playerSettings.setPlaybackRate(rate)
      playerRef.current?.setPlaybackRate(rate)
    },
    [playerSettings]
  )

  // Apply settings when player is ready
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      playerRef.current.setPlaybackRate(settings.playbackRate)
      playerRef.current.setVolume(settings.volume)
    }
  }, [isPlaying, settings.playbackRate, settings.volume])

  // ============================================================================
  // Document title
  // ============================================================================

  useEffect(() => {
    if (!playbackSession?.displayTitle) return
    document.title = t('TitleAudiobookshelfNamed', { 0: playbackSession.displayTitle })
  }, [playbackSession?.displayTitle, t])

  // ============================================================================
  // Media Session API
  // ============================================================================

  useEffect(() => {
    if (!playbackSession || !('mediaSession' in navigator)) return

    const bookTitle = playbackSession.displayTitle || unknownLabel
    const chapterTitle = currentChapter?.title
    const title = chapterTitle ? t('LabelMediaSessionTitleWithChapter', { title: bookTitle, chapter: chapterTitle }) : bookTitle
    const artist = playbackSession.displayAuthor || unknownLabel

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      artwork: playbackSession.coverPath ? [{ src: coverUrl }] : []
    })

    navigator.mediaSession.setActionHandler('play', play)
    navigator.mediaSession.setActionHandler('pause', pause)
    navigator.mediaSession.setActionHandler('stop', pause)
    navigator.mediaSession.setActionHandler('seekbackward', jumpBackward)
    navigator.mediaSession.setActionHandler('seekforward', jumpForward)
    navigator.mediaSession.setActionHandler('seekto', (e) => {
      if (e.seekTime != null && !isNaN(e.seekTime)) seek(e.seekTime)
    })
    navigator.mediaSession.setActionHandler('previoustrack', jumpBackward)
    navigator.mediaSession.setActionHandler('nexttrack', jumpForward)
  }, [playbackSession, coverUrl, play, pause, jumpBackward, jumpForward, seek, currentChapter, unknownLabel, t])

  // Update media session playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // ============================================================================
  // Window resize
  // ============================================================================

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ============================================================================
  // Keyboard hotkeys
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current || !hasLoaded) return

      switch (e.key) {
        case ' ':
        case 'MediaPlayPause':
          e.preventDefault()
          playPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          jumpBackward()
          break
        case 'ArrowRight':
          e.preventDefault()
          jumpForward()
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(settings.volume + 0.05, 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(settings.volume - 0.05, 0))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasLoaded, playPause, jumpBackward, jumpForward, setVolume, settings.volume])

  // ============================================================================
  // Track bar interaction
  // ============================================================================

  const trackRef = useRef<HTMLDivElement>(null)

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hasLoaded || !trackRef.current || !duration) return
      const rect = trackRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const perc = offsetX / rect.width
      const time = perc * duration
      if (!isNaN(time)) seek(time)
    },
    [hasLoaded, duration, seek]
  )

  // ============================================================================
  // Download
  // ============================================================================

  const downloadShareItem = useCallback(() => {
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [downloadUrl])

  // ============================================================================
  // Volume icon
  // ============================================================================

  const volumeIcon = settings.volume === 0 ? 'volume_off' : settings.volume < 0.5 ? 'volume_down' : 'volume_up'

  const toggleMute = useCallback(() => {
    const newVol = playerSettings.toggleMute()
    playerRef.current?.setVolume(newVol)
  }, [playerSettings])

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="text-foreground page-bg-gradient flex h-dvh w-full items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="la-2x" />
          <p className="text-foreground-muted text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (fetchError || !shareData || !playbackSession) {
    return (
      <div className="text-foreground page-bg-gradient flex h-dvh w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols text-foreground-subdued text-5xl">error</span>
          <p className="text-foreground-muted text-xl">{fetchError || 'Failed to load shared item'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-foreground page-bg-gradient relative h-dvh max-h-dvh w-full max-w-full overflow-hidden">
      {/* Main content */}
      <div className="absolute inset-0 z-10 flex h-dvh w-screen items-center justify-center">
        <div className="w-full p-2 sm:p-4 md:p-8">
          {/* Cover image */}
          {!isMobileLandscape && (
            <div className="mx-auto my-2 overflow-hidden rounded-xl" style={{ width: coverWidth, height: coverHeight }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="" className="h-full w-full object-contain" crossOrigin="anonymous" />
            </div>
          )}

          {/* Title */}
          <p className="text-foreground mb-1 line-clamp-2 text-center text-2xl font-semibold lg:text-3xl">{playbackSession.displayTitle || 'No title'}</p>

          {/* Author */}
          {playbackSession.displayAuthor && (
            <p className="text-foreground-muted mb-1 truncate text-center text-lg font-semibold lg:text-xl">{playbackSession.displayAuthor}</p>
          )}

          {/* Player UI */}
          <div className="mx-auto w-full max-w-2xl pt-8">
            {/* Track bar */}
            <div className="mb-2">
              <div
                ref={trackRef}
                className="bg-track-bg relative h-2 w-full cursor-pointer overflow-hidden rounded-full transition-transform duration-100 hover:scale-y-125"
                onClick={handleTrackClick}
              >
                {/* Buffered */}
                <div
                  className="bg-track-progress/50 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Played */}
                <div
                  className="bg-track-progress pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
                  style={{ width: `${playedPercent}%` }}
                />
                {/* Loading shimmer */}
                {playerState === PlayerState.LOADING && (
                  <div className="via-track-progress/30 loading-track-slide pointer-events-none absolute top-0 h-full w-1/4 bg-linear-to-r from-transparent to-transparent" />
                )}
              </div>

              {/* Time display */}
              <div className="mt-1 flex items-center justify-between">
                <p className="text-foreground-muted font-mono text-xs">{currentTimeFormatted}</p>
                {currentChapter && <p className="text-foreground-muted truncate px-2 text-xs">{currentChapter.title}</p>}
                <p className="text-foreground-muted font-mono text-xs">{timeRemainingFormatted}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {/* Volume */}
              <Tooltip text="Volume" position="top">
                <IconBtn borderless size="custom" className="w-9 text-2xl" onClick={toggleMute}>
                  {volumeIcon}
                </IconBtn>
              </Tooltip>

              {/* Jump backward */}
              <Tooltip text={`Jump back ${settings.jumpBackwardAmount}s`} position="top">
                <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={jumpBackward}>
                  replay
                </IconBtn>
              </Tooltip>

              {/* Play/Pause */}
              <IconBtn
                borderless
                size="custom"
                loading={playerState === PlayerState.LOADING}
                outlined={false}
                className="player-play-btn bg-accent text-primary hover:text-primary hover:not-disabled:text-primary h-12 w-12 rounded-full text-3xl"
                onClick={playPause}
              >
                {isPlaying ? 'pause' : 'play_arrow'}
              </IconBtn>

              {/* Jump forward */}
              <Tooltip text={`Jump forward ${settings.jumpForwardAmount}s`} position="top">
                <IconBtn borderless size="custom" className="w-10 text-3xl" onClick={jumpForward}>
                  forward_media
                </IconBtn>
              </Tooltip>

              {/* Playback rate */}
              <Tooltip text="Playback speed" position="top">
                <button
                  type="button"
                  onClick={() => {
                    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
                    const currentIdx = rates.indexOf(settings.playbackRate)
                    const nextRate = rates[(currentIdx + 1) % rates.length]
                    setPlaybackRate(nextRate)
                  }}
                  className="text-foreground-muted hover:text-foreground min-w-12 cursor-pointer text-center text-sm font-medium tabular-nums transition-colors"
                >
                  {settings.playbackRate}x
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Download button */}
          {shareData.isDownloadable && (
            <div className="absolute top-0 left-0 m-4">
              <Tooltip text={t('LabelDownload')} position="bottom">
                <button
                  aria-label={t('LabelDownload')}
                  className="text-foreground-muted hover:text-foreground cursor-pointer transition-colors"
                  onClick={downloadShareItem}
                >
                  <span className="material-symbols text-2xl sm:text-3xl">download</span>
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
