import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { isBookMetadata, PlayerState, type Chapter, type LibraryItem } from '@/types/api'
import { useEffect, useRef } from 'react'

const MEDIA_SESSION_ACTIONS = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack'] as const

interface UseMediaSessionOptions {
  libraryItem: LibraryItem | null
  playerHandler: PlayerHandler
  onPreviousTrack?: () => void
  onNextTrack?: () => void
  enabled?: boolean
}

function buildChapterInfo(chapters: Chapter[]) {
  if (!chapters.length) return undefined

  return chapters.map((chapter) => ({
    title: chapter.title,
    startTime: chapter.start
  }))
}

function buildMediaMetadata(libraryItem: LibraryItem, displayTitle: string | null, displayAuthor: string | null, chapters: Chapter[]): MediaMetadata {
  const metadata = libraryItem.media.metadata
  const title = displayTitle || metadata.title || 'Unknown'
  const artist = displayAuthor || (isBookMetadata(metadata) ? metadata.authorName : undefined) || 'Unknown'
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

/** Wire lock-screen / OS media controls via the Media Session API (parity with Vue MediaPlayerContainer). */
export function useMediaSession({ libraryItem, playerHandler, onPreviousTrack, onNextTrack, enabled = true }: UseMediaSessionOptions) {
  const onPreviousTrackRef = useRef(onPreviousTrack)
  onPreviousTrackRef.current = onPreviousTrack
  const onNextTrackRef = useRef(onNextTrack)
  onNextTrackRef.current = onNextTrack

  const controlsRef = useRef(playerHandler.controls)
  controlsRef.current = playerHandler.controls

  const { playerState, displayTitle, displayAuthor, chapters } = playerHandler.state
  const isPlaying = playerState === PlayerState.PLAYING

  // Metadata only when track identity changes — not on every playback tick (Cast dialog reads this).
  useEffect(() => {
    if (!enabled || !libraryItem || !('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = buildMediaMetadata(libraryItem, displayTitle, displayAuthor, chapters)

    return () => {
      navigator.mediaSession.metadata = null
    }
  }, [enabled, libraryItem, displayAuthor, displayTitle, chapters])

  // Action handlers use refs so seek/jump callbacks changing with currentTime do not reset metadata.
  useEffect(() => {
    if (!enabled || !('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => controlsRef.current.play())
    navigator.mediaSession.setActionHandler('pause', () => controlsRef.current.pause())
    navigator.mediaSession.setActionHandler('stop', () => controlsRef.current.pause())
    navigator.mediaSession.setActionHandler('seekbackward', () => controlsRef.current.jumpBackward())
    navigator.mediaSession.setActionHandler('seekforward', () => controlsRef.current.jumpForward())
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null && !Number.isNaN(details.seekTime)) {
        controlsRef.current.seek(details.seekTime)
      }
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => onPreviousTrackRef.current?.())
    navigator.mediaSession.setActionHandler('nexttrack', () => onNextTrackRef.current?.())

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
}
