'use client'

import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaContext, usePlayerState } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useMediaSession } from '@/hooks/useMediaSession'
import { usePlayerChapterQueueNavigation } from '@/hooks/usePlayerChapterQueueNavigation'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { getEpisodeDuration } from '@/lib/episode'
import { mergeClasses } from '@/lib/merge-classes'
import { isBookMedia, isBookMetadata, isPodcastLibraryItem, isPodcastMetadata, LibraryItem } from '@/types/api'
import { CSSProperties, useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import IconBtn from '../ui/IconBtn'
import PlayerControls from './PlayerControls'
import PlayerFullscreen from './PlayerFullscreen'
import PlayerMetadataBlock, { type PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerMobileLayout from './PlayerMobileLayout'
import PlayerModals from './PlayerModals'
import PlayerTrackBar from './PlayerTrackBar'
import { usePlayerControlsState } from './usePlayerControlsState'

export function getPlayerBottomInsetClass(): string {
  return 'bottom-[var(--media-player-height,10rem)] lg:bottom-40'
}

/** 1rem gap above the player — uses live `--media-player-height` when streaming. */
export function getCoverSizeWidgetBottomClass(isStreaming: boolean): string {
  if (!isStreaming) return 'bottom-4'
  return 'bottom-[calc(var(--media-player-height,10rem)+1rem)]'
}

function syncMediaPlayerHeightCssVar(el: HTMLElement) {
  document.documentElement.style.setProperty('--media-player-height', `${el.getBoundingClientRect().height}px`)
}

function clearMediaPlayerHeightCssVar() {
  document.documentElement.style.removeProperty('--media-player-height')
}

export default function MediaPlayerContainer() {
  const t = useTypeSafeTranslations()
  const { streamLibraryItem, streamEpisodeId, clearStreamMedia, playerControls, isPlayerFullscreen, setPlayerFullscreen } = useMediaContext()
  const playerState = usePlayerState()
  const playerHandler = useMemo((): PlayerHandler => ({ state: playerState, controls: playerControls }), [playerControls, playerState])

  // Escape leaves fullscreen before it closes the player
  const handleHotkeyClose = useCallback(() => {
    if (isPlayerFullscreen) {
      setPlayerFullscreen(false)
      return
    }
    clearStreamMedia()
  }, [clearStreamMedia, isPlayerFullscreen, setPlayerFullscreen])

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, !!streamLibraryItem, handleHotkeyClose)

  const { handleNext, handlePrevious } = usePlayerChapterQueueNavigation(playerHandler, streamLibraryItem)

  useMediaSession({
    libraryItem: streamLibraryItem,
    playerHandler,
    onPreviousTrack: handlePrevious,
    onNextTrack: handleNext,
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

  if (!streamLibraryItem || !playerMetadata) {
    return null
  }

  return (
    <PlayerSurface
      playerHandler={playerHandler}
      streamLibraryItem={streamLibraryItem}
      metadata={playerMetadata}
      accentStyle={playerAccentStyle}
      hasAccentColor={accentRgb !== null}
    />
  )
}

interface PlayerSurfaceProps {
  playerHandler: PlayerHandler
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  accentStyle?: CSSProperties
  hasAccentColor: boolean
}

/**
 * Owns the single controls state shared by the mini player, the fullscreen player and the
 * player modals. Keeping one instance means transient state like the sleep timer survives
 * moving between layouts.
 */
function PlayerSurface({ playerHandler, streamLibraryItem, metadata, accentStyle, hasAccentColor }: PlayerSurfaceProps) {
  const t = useTypeSafeTranslations()
  const { clearStreamMedia, isPlayerDetailsExpanded, isPlayerFullscreen, setPlayerFullscreen } = useMediaContext()
  const coverAspectRatio = useBookCoverAspectRatio()
  const isDesktop = useMediaQuery('lg')
  const controlsState = usePlayerControlsState(playerHandler, streamLibraryItem)

  const playerShellRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = playerShellRef.current
    if (!el) return

    syncMediaPlayerHeightCssVar(el)
    const resizeObserver = new ResizeObserver(() => syncMediaPlayerHeightCssVar(el))
    resizeObserver.observe(el)

    return () => {
      resizeObserver.disconnect()
      clearMediaPlayerHeightCssVar()
    }
  }, [isPlayerDetailsExpanded, isDesktop])

  const openFullscreen = useCallback(() => setPlayerFullscreen(true), [setPlayerFullscreen])
  const closeFullscreen = useCallback(() => setPlayerFullscreen(false), [setPlayerFullscreen])

  return (
    <>
      <div
        ref={playerShellRef}
        className={mergeClasses(
          'bg-primary shadow-media-player fixed right-0 bottom-0 left-0 isolate z-50 w-full pt-2',
          isDesktop ? 'h-40 px-4 pb-4' : mergeClasses('px-2 pb-1', isPlayerDetailsExpanded ? 'min-h-[11.875rem]' : 'min-h-[8.75rem]')
        )}
        style={accentStyle}
      >
        {hasAccentColor ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}

        {isDesktop ? (
          <div className="relative z-[1]">
            <div className="absolute top-0 left-0 flex min-w-0 items-start gap-4">
              <PlayerMetadataBlock streamLibraryItem={streamLibraryItem} metadata={metadata} coverAspectRatio={coverAspectRatio} coverWidth={77} />
            </div>
            <div className="absolute top-0 right-0 flex items-center gap-1">
              <IconBtn size="small" borderless onClick={openFullscreen} ariaLabel={t('LabelOpenFullscreenPlayer')}>
                open_in_full
              </IconBtn>
              <IconBtn size="small" borderless onClick={clearStreamMedia} ariaLabel={t('LabelClosePlayer')}>
                close
              </IconBtn>
            </div>
            <div className="flex flex-col gap-3">
              <PlayerControls controls={controlsState} />
              <PlayerTrackBar playerHandler={playerHandler} variant="full" />
            </div>
          </div>
        ) : (
          <div className="relative z-[1]">
            <PlayerMobileLayout
              controls={controlsState}
              streamLibraryItem={streamLibraryItem}
              metadata={metadata}
              onClose={clearStreamMedia}
              onExpandFullscreen={openFullscreen}
            />
          </div>
        )}
      </div>

      {isPlayerFullscreen && <PlayerFullscreen controls={controlsState} metadata={metadata} onMinimize={closeFullscreen} />}

      <PlayerModals controls={controlsState} />
    </>
  )
}
