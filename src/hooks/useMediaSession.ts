import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { getPlayerProgress, subscribePlayerProgress } from '@/lib/player/playerProgressStore'
import { isBookMetadata, PlayerState, type Chapter, type LibraryItem } from '@/types/api'
import { useEffect, useRef } from 'react'

const MEDIA_SESSION_ACTIONS = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack'] as const

interface UseMediaSessionOptions {
  libraryItem: LibraryItem | null
  playerHandler: PlayerHandler
  enabled?: boolean
}

interface MediaSessionPositionInput {
  useChapterTrack: boolean
  currentChapter: Chapter | null
  currentTime: number
  duration: number
  playbackRate: number
}

function buildChapterInfo(chapters: Chapter[]) {
  if (!chapters.length) return undefined

  return chapters.map((chapter) => ({
    title: chapter.title,
    startTime: chapter.start
  }))
}

function buildMediaMetadata(
  libraryItem: LibraryItem,
  displayTitle: string | null,
  displayAuthor: string | null,
  chapters: Chapter[],
  unknownLabel: string
): MediaMetadata {
  const metadata = libraryItem.media.metadata
  const title = displayTitle || metadata.title || unknownLabel
  const artist = displayAuthor || (isBookMetadata(metadata) ? metadata.authorName : undefined) || unknownLabel
  const album = isBookMetadata(metadata) ? (metadata.seriesName ?? '') : ''
  const coverUrl = getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)
  const chapterInfo = buildChapterInfo(chapters)

  const init: MediaMetadataInit & { chapterInfo?: { title: string; startTime: number }[] } = {
    title,
    artist,
    album,
    artwork: [{ src: coverUrl }],
    ...(chapterInfo ? { chapterInfo } : {})
  }

  return new MediaMetadata(init)
}

function buildChapterMediaMetadata(
  libraryItem: LibraryItem,
  displayTitle: string | null,
  displayAuthor: string | null,
  currentChapter: Chapter,
  unknownLabel: string
): MediaMetadata {
  const metadata = libraryItem.media.metadata
  const bookTitle = displayTitle || metadata.title || unknownLabel
  const author = displayAuthor || (isBookMetadata(metadata) ? metadata.authorName : undefined) || unknownLabel
  const coverUrl = getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)

  // Audible-style lock screen: book title primary, chapter name secondary; author in album (expanded views).
  return new MediaMetadata({
    title: bookTitle,
    artist: currentChapter.title || unknownLabel,
    album: author,
    artwork: [{ src: coverUrl }]
  })
}

function getMediaSessionPositionState({
  useChapterTrack,
  currentChapter,
  currentTime,
  duration,
  playbackRate
}: MediaSessionPositionInput): MediaPositionState | null {
  if (useChapterTrack && currentChapter) {
    const chapterStart = currentChapter.start
    const chapterEnd = currentChapter.end
    const chapterDuration = chapterEnd - chapterStart

    let chapterPosition = currentTime - chapterStart
    chapterPosition = Math.max(0, Math.min(chapterPosition, chapterDuration))

    if (Number.isNaN(chapterDuration) || chapterDuration <= 0 || Number.isNaN(chapterPosition)) {
      return null
    }

    return { duration: chapterDuration, position: chapterPosition, playbackRate }
  }

  if (duration > 0) {
    const position = Math.max(0, Math.min(currentTime, duration))

    if (Number.isNaN(duration) || Number.isNaN(position)) {
      return null
    }

    return { duration, position, playbackRate }
  }

  return null
}

function setMediaSessionPositionState(positionState: MediaPositionState | null) {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return
  if (!positionState) return

  try {
    navigator.mediaSession.setPositionState(positionState)
  } catch (error) {
    console.error('Error setting media session position state:', error)
  }
}

/** Wire lock-screen / OS media controls via the Media Session API (parity with Vue MediaPlayerContainer). */
export function useMediaSession({ libraryItem, playerHandler, enabled = true }: UseMediaSessionOptions) {
  const t = useTypeSafeTranslations()
  const unknownLabel = t('LabelUnknown')

  const controlsRef = useRef(playerHandler.controls)
  controlsRef.current = playerHandler.controls

  const { playerState, displayTitle, displayAuthor, chapters, currentChapter, duration, settings } = playerHandler.state
  const isPlaying = playerState === PlayerState.PLAYING
  const useChapterTrack = settings.useChapterTrack && chapters.length > 0

  const useChapterTrackRef = useRef(useChapterTrack)
  useChapterTrackRef.current = useChapterTrack
  const currentChapterRef = useRef(currentChapter)
  currentChapterRef.current = currentChapter
  const positionInputRef = useRef({
    useChapterTrack,
    currentChapter,
    duration,
    playbackRate: settings.playbackRate
  })
  positionInputRef.current = {
    useChapterTrack,
    currentChapter,
    duration,
    playbackRate: settings.playbackRate
  }

  // Metadata when track identity or chapter changes — not on every playback tick (Cast dialog reads this).
  useEffect(() => {
    if (!enabled || !libraryItem || !('mediaSession' in navigator)) return

    if (useChapterTrack && currentChapter) {
      navigator.mediaSession.metadata = buildChapterMediaMetadata(libraryItem, displayTitle, displayAuthor, currentChapter, unknownLabel)
    } else {
      navigator.mediaSession.metadata = buildMediaMetadata(libraryItem, displayTitle, displayAuthor, chapters, unknownLabel)
    }

    return () => {
      navigator.mediaSession.metadata = null
    }
  }, [enabled, libraryItem, displayAuthor, displayTitle, chapters, useChapterTrack, currentChapter, unknownLabel])

  // Action handlers use refs so seek/jump callbacks changing with currentTime do not reset metadata.
  useEffect(() => {
    if (!enabled || !('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => controlsRef.current.play())
    navigator.mediaSession.setActionHandler('pause', () => controlsRef.current.pause())
    navigator.mediaSession.setActionHandler('stop', () => controlsRef.current.pause())
    navigator.mediaSession.setActionHandler('seekbackward', () => controlsRef.current.jumpBackward())
    navigator.mediaSession.setActionHandler('seekforward', () => controlsRef.current.jumpForward())
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime == null || Number.isNaN(details.seekTime)) return

      const chapter = currentChapterRef.current
      if (useChapterTrackRef.current && chapter) {
        const chapterDuration = chapter.end - chapter.start
        const clampedSeekTime = Math.max(0, Math.min(details.seekTime, chapterDuration))
        controlsRef.current.seek(chapter.start + clampedSeekTime)
        return
      }

      controlsRef.current.seek(details.seekTime)
    })
    // Vue parity: prev/next track also jump (compact lock-screen UIs usually show seek OR track buttons, not both).
    navigator.mediaSession.setActionHandler('previoustrack', () => controlsRef.current.jumpBackward())
    navigator.mediaSession.setActionHandler('nexttrack', () => controlsRef.current.jumpForward())

    return () => {
      for (const action of MEDIA_SESSION_ACTIONS) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch {
          // Some browsers reject clearing unsupported actions.
        }
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [enabled, isPlaying])

  // Position state: subscribe to progress store directly so playback ticks do not re-render the player shell.
  useEffect(() => {
    if (!enabled || !('mediaSession' in navigator)) return

    const updatePositionState = () => {
      const { currentTime } = getPlayerProgress()
      const { useChapterTrack, currentChapter, duration, playbackRate } = positionInputRef.current

      setMediaSessionPositionState(
        getMediaSessionPositionState({
          useChapterTrack,
          currentChapter,
          currentTime,
          duration,
          playbackRate
        })
      )
    }

    updatePositionState()
    return subscribePlayerProgress(updatePositionState)
  }, [enabled, useChapterTrack, currentChapter, duration, settings.playbackRate])
}
