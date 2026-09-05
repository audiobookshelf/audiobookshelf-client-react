'use client'

import { useMediaContext, usePlayerState } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useMediaSession } from '@/hooks/useMediaSession'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { getEpisodeDuration } from '@/lib/episode'
import { clearMediaPlayerHeightCssVar, getPlayerMiniCloseDurationMs } from '@/lib/player/miniPlayerCloseAnimation'
import { isBookMedia, isBookMetadata, isPodcastLibraryItem, isPodcastMetadata } from '@/types/api'
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PlayerShell from './PlayerShell'

export function getPlayerBottomInsetClass(): string {
  return 'bottom-[var(--media-player-height,0px)]'
}

/** 1rem gap above the player — uses live `--media-player-height` when streaming. */
export function getCoverSizeWidgetBottomClass(isStreaming: boolean): string {
  if (!isStreaming) return 'bottom-4'
  return 'bottom-[calc(var(--media-player-height,0px)+1rem)]'
}

export default function MediaPlayerContainer() {
  const t = useTypeSafeTranslations()
  const { streamLibraryItem, streamEpisodeId, clearStreamMedia, playerControls, isPlayerFullscreen, setPlayerFullscreen } = useMediaContext()
  const playerState = usePlayerState()
  const playerHandler = useMemo((): PlayerHandler => ({ state: playerState, controls: playerControls }), [playerControls, playerState])
  const [isClosing, setIsClosing] = useState(false)
  const closingRef = useRef(false)
  const finalizeOnceRef = useRef(false)
  const finalizeMiniCloseRef = useRef<() => void>(() => {})

  const resetCloseState = useCallback(() => {
    closingRef.current = false
    finalizeOnceRef.current = false
    setIsClosing(false)
  }, [])

  const finalizeMiniClose = useCallback(async () => {
    if (!closingRef.current || finalizeOnceRef.current) return

    finalizeOnceRef.current = true
    closingRef.current = false

    try {
      await clearStreamMedia()
    } finally {
      finalizeOnceRef.current = false
      setIsClosing(false)
    }
  }, [clearStreamMedia])

  finalizeMiniCloseRef.current = () => {
    void finalizeMiniClose()
  }

  const handleClosePlayer = useCallback(() => {
    if (isPlayerFullscreen) {
      void clearStreamMedia()
      return
    }

    if (closingRef.current) return

    const durationMs = getPlayerMiniCloseDurationMs()
    if (durationMs <= 0) {
      void clearStreamMedia()
      return
    }

    playerControls.stopPlaybackImmediately()
    closingRef.current = true
    setIsClosing(true)
  }, [clearStreamMedia, isPlayerFullscreen, playerControls])

  useEffect(() => {
    if (!isClosing) return

    const durationMs = getPlayerMiniCloseDurationMs()

    const fallbackTimeout = window.setTimeout(() => {
      finalizeMiniCloseRef.current()
    }, durationMs + 50)

    return () => {
      window.clearTimeout(fallbackTimeout)
    }
  }, [isClosing])

  const handleHotkeyClose = useCallback(() => {
    if (isPlayerFullscreen) {
      setPlayerFullscreen(false)
      return
    }
    handleClosePlayer()
  }, [handleClosePlayer, isPlayerFullscreen, setPlayerFullscreen])

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, !!streamLibraryItem, handleHotkeyClose)

  useMediaSession({
    libraryItem: streamLibraryItem,
    playerHandler,
    enabled: !!streamLibraryItem
  })

  const coverPath = streamLibraryItem?.media?.coverPath
  const accentSourceUrl = useMemo(
    () => (streamLibraryItem && coverPath ? getLibraryItemCoverUrl(streamLibraryItem.id, streamLibraryItem.updatedAt, true) : null),
    [coverPath, streamLibraryItem]
  )
  const accentRgb = useCoverAccentColor(accentSourceUrl)

  const playerAccentStyle = useMemo((): CSSProperties | undefined => {
    if (!accentRgb) return undefined
    return { '--tc-player-accent-rgb': `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}` } as CSSProperties
  }, [accentRgb])

  const playerMetadata = useMemo(() => {
    if (!streamLibraryItem) return null

    const metadata = streamLibraryItem.media.metadata
    const isPodcast = isPodcastLibraryItem(streamLibraryItem)
    const streamEpisode = isPodcast && streamEpisodeId ? streamLibraryItem.media.episodes?.find((episode) => episode.id === streamEpisodeId) : undefined
    const bookAuthors = isBookMetadata(metadata) ? metadata.authors || [] : []
    const podcastAuthor = isPodcast && isPodcastMetadata(metadata) ? metadata.author || t('LabelUnknown') : null
    const displayTitle = playerHandler.state.displayTitle || metadata.title || ''

    const playbackRate = playerHandler.state.settings.playbackRate
    let totalDuration = playerHandler.state.duration
    if (totalDuration <= 0) {
      if (streamEpisode) {
        totalDuration = getEpisodeDuration(streamEpisode)
      } else if (isBookMedia(streamLibraryItem.media)) {
        totalDuration = streamLibraryItem.media.duration ?? 0
      }
    }

    const durationLabel = totalDuration > 0 ? secondsToTimestamp(totalDuration / playbackRate) : null

    return {
      displayTitle,
      bookAuthors,
      podcastAuthor,
      durationLabel
    }
  }, [playerHandler.state.displayTitle, playerHandler.state.duration, playerHandler.state.settings.playbackRate, streamEpisodeId, streamLibraryItem, t])

  useLayoutEffect(() => {
    if (!streamLibraryItem) {
      clearMediaPlayerHeightCssVar()
      resetCloseState()
    }
  }, [resetCloseState, streamLibraryItem])

  if (!streamLibraryItem || !playerMetadata) {
    return null
  }

  return (
    <PlayerShell
      playerHandler={playerHandler}
      streamLibraryItem={streamLibraryItem}
      metadata={playerMetadata}
      accentStyle={playerAccentStyle}
      showAccentBackdrop={accentRgb !== null}
      isClosing={isClosing}
      onClose={handleClosePlayer}
      onCloseAnimationEnd={finalizeMiniClose}
    />
  )
}
