'use client'

import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaContext, usePlayerState } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useMediaSession } from '@/hooks/useMediaSession'
import { usePlayerChapterQueueNavigation } from '@/hooks/usePlayerChapterQueueNavigation'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useIsLgViewport } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { getEpisodeDuration } from '@/lib/episode'
import { mergeClasses } from '@/lib/merge-classes'
import { isBookMedia, isBookMetadata, isPodcastLibraryItem, isPodcastMetadata } from '@/types/api'
import { CSSProperties, useLayoutEffect, useMemo, useRef } from 'react'
import IconBtn from '../ui/IconBtn'
import PlayerControls from './PlayerControls'
import PlayerMetadataBlock from './PlayerMetadataBlock'
import PlayerMobileLayout from './PlayerMobileLayout'
import PlayerTrackBar from './PlayerTrackBar'

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
  const { streamLibraryItem, streamEpisodeId, clearStreamMedia, playerControls, isPlayerDetailsExpanded } = useMediaContext()
  const playerState = usePlayerState()
  const playerHandler = useMemo((): PlayerHandler => ({ state: playerState, controls: playerControls }), [playerControls, playerState])
  const coverAspectRatio = useBookCoverAspectRatio()
  const isDesktop = useIsLgViewport()

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, !!streamLibraryItem, clearStreamMedia)

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

  const playerShellRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!streamLibraryItem) {
      clearMediaPlayerHeightCssVar()
      return
    }

    const el = playerShellRef.current
    if (!el) return

    syncMediaPlayerHeightCssVar(el)
    const resizeObserver = new ResizeObserver(() => syncMediaPlayerHeightCssVar(el))
    resizeObserver.observe(el)

    return () => {
      resizeObserver.disconnect()
      clearMediaPlayerHeightCssVar()
    }
  }, [streamLibraryItem, isPlayerDetailsExpanded, isDesktop])

  if (!streamLibraryItem || !playerMetadata) {
    return null
  }

  return (
    <div
      ref={playerShellRef}
      className={mergeClasses(
        'bg-primary shadow-media-player fixed right-0 bottom-0 left-0 isolate z-50 w-full pt-2',
        isDesktop ? 'h-40 px-4 pb-4' : mergeClasses('px-2 pb-1', isPlayerDetailsExpanded ? 'min-h-[11.875rem]' : 'min-h-[8.75rem]')
      )}
      style={playerAccentStyle}
    >
      {accentRgb !== null ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}

      {isDesktop ? (
        <div className="relative z-[1]">
          <div className="absolute top-0 left-0 flex min-w-0 items-start gap-4">
            <PlayerMetadataBlock streamLibraryItem={streamLibraryItem} metadata={playerMetadata} coverAspectRatio={coverAspectRatio} coverWidth={77} />
          </div>
          <div className="absolute top-0 right-0 flex items-center gap-1">
            <IconBtn size="small" borderless onClick={clearStreamMedia} ariaLabel={t('LabelClosePlayer')}>
              close
            </IconBtn>
          </div>
          <div className="flex flex-col gap-3">
            <PlayerControls playerHandler={playerHandler} streamLibraryItem={streamLibraryItem} />
            <PlayerTrackBar playerHandler={playerHandler} variant="full" />
          </div>
        </div>
      ) : (
        <div className="relative z-[1]">
          <PlayerMobileLayout playerHandler={playerHandler} streamLibraryItem={streamLibraryItem} metadata={playerMetadata} onClose={clearStreamMedia} />
        </div>
      )}
    </div>
  )
}
