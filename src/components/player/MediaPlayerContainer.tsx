'use client'

import { useMediaContext, usePlayerState } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useMediaSession } from '@/hooks/useMediaSession'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getEpisodeCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { getEpisodeDuration } from '@/lib/episode'
import { isBookMedia, isBookMetadata, isPodcastLibraryItem, isPodcastMetadata } from '@/types/api'
import { CSSProperties, useCallback, useMemo } from 'react'
import PlayerShell from './PlayerShell'

export default function MediaPlayerContainer() {
  const t = useTypeSafeTranslations()
  const { streamLibraryItem, streamEpisodeId, clearStreamMedia, playerControls, isPlayerFullscreen, setPlayerFullscreen } = useMediaContext()
  const playerState = usePlayerState()
  const playerHandler = useMemo((): PlayerHandler => ({ state: playerState, controls: playerControls }), [playerControls, playerState])

  const handleClosePlayer = useCallback(() => {
    void clearStreamMedia()
  }, [clearStreamMedia])

  const handleHotkeyClose = useCallback(() => {
    if (isPlayerFullscreen) {
      setPlayerFullscreen(false)
      return
    }
    handleClosePlayer()
  }, [handleClosePlayer, isPlayerFullscreen, setPlayerFullscreen])

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, !!streamLibraryItem, handleHotkeyClose)

  const streamEpisode =
    streamLibraryItem && isPodcastLibraryItem(streamLibraryItem)
      ? streamLibraryItem.media.episodes?.find((episode) => episode.id === streamEpisodeId)
      : undefined

  useMediaSession({
    libraryItem: streamLibraryItem,
    playerHandler,
    enabled: !!streamLibraryItem,
    episode: streamEpisode
  })

  const hasCover = !!streamEpisode?.coverPath || !!streamLibraryItem?.media.coverPath
  const accentSourceUrl = streamLibraryItem && hasCover ? getEpisodeCoverSrc(streamLibraryItem, streamEpisode, getPlaceholderCoverUrl()) : null
  const accentRgb = useCoverAccentColor(accentSourceUrl)

  const playerAccentStyle = useMemo((): CSSProperties | undefined => {
    if (!accentRgb) return undefined
    return { '--tc-player-accent-rgb': `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}` } as CSSProperties
  }, [accentRgb])

  const playerMetadata = useMemo(() => {
    if (!streamLibraryItem) return null

    const metadata = streamLibraryItem.media.metadata
    const isPodcast = isPodcastLibraryItem(streamLibraryItem)
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
  }, [playerHandler.state.displayTitle, playerHandler.state.duration, playerHandler.state.settings.playbackRate, streamEpisode, streamLibraryItem, t])

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
      onClose={handleClosePlayer}
      episode={streamEpisode}
    />
  )
}
