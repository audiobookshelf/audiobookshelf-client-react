'use client'

import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaContext, usePlayerState } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useExitTransition } from '@/hooks/useExitTransition'
import { usePlayerFullscreenHistory } from '@/hooks/usePlayerFullscreenHistory'
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
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import IconBtn from '../ui/IconBtn'
import PlayerControls from './PlayerControls'
import PlayerFullscreen from './PlayerFullscreen'
import PlayerMetadataBlock, { type PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerMobileLayout from './PlayerMobileLayout'
import PlayerModals from './PlayerModals'
import PlayerTrackBar from './PlayerTrackBar'
import { usePlayerControlsState } from './usePlayerControlsState'

/** Must match the `player-fullscreen-exit` animation in transitions.css */
const FULLSCREEN_EXIT_MS = 220

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
  const { streamLibraryItem, streamEpisodeId, playerControls } = useMediaContext()
  const playerState = usePlayerState()
  const playerHandler = useMemo((): PlayerHandler => ({ state: playerState, controls: playerControls }), [playerControls, playerState])

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
  const { clearStreamMedia, isPlayerDetailsExpanded, isPlayerFullscreen, setPlayerFullscreen, streamEpisodeId } = useMediaContext()
  const coverAspectRatio = useBookCoverAspectRatio()
  const isDesktop = useMediaQuery('lg')
  const controlsState = usePlayerControlsState(playerHandler, streamLibraryItem)

  // Registered here rather than a level up so the hotkeys can reach the same modal state the
  // toolbars use — `?` has to open the shortcuts sheet that PlayerModals renders
  const { setIsShortcutsModalOpen } = controlsState

  // Escape leaves fullscreen before it closes the player
  const handleHotkeyClose = useCallback(() => {
    if (isPlayerFullscreen) {
      setPlayerFullscreen(false)
      return
    }
    clearStreamMedia()
  }, [clearStreamMedia, isPlayerFullscreen, setPlayerFullscreen])

  const handleShowShortcuts = useCallback(() => setIsShortcutsModalOpen(true), [setIsShortcutsModalOpen])
  const handleShowChapters = useCallback(() => {
    if (controlsState.chapters.length > 0) controlsState.setIsChaptersModalOpen(true)
  }, [controlsState])

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, true, handleHotkeyClose, handleShowShortcuts, handleShowChapters)

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

  // Back button dismisses the overlay instead of leaving the page behind it
  usePlayerFullscreenHistory(isPlayerFullscreen, closeFullscreen)

  // Opt-in: opening fullscreen for every new item is right for people who listen with the
  // player in front of them, and wrong for everyone reading the library while it plays.
  // Keyed on the item, so pausing and resuming the same book does not reopen it.
  const autoOpenFullscreen = playerHandler.state.settings.autoOpenFullscreenOnPlay
  const streamId = `${streamLibraryItem.id}:${streamEpisodeId ?? ''}`
  const autoOpenedStreamRef = useRef<string | null>(null)

  useEffect(() => {
    if (!autoOpenFullscreen || autoOpenedStreamRef.current === streamId) return
    autoOpenedStreamRef.current = streamId
    setPlayerFullscreen(true)
  }, [autoOpenFullscreen, setPlayerFullscreen, streamId])

  // Held on screen just long enough to animate out
  const { isMounted: isFullscreenMounted, isExiting: isFullscreenExiting } = useExitTransition(isPlayerFullscreen, FULLSCREEN_EXIT_MS)

  return (
    <>
      <div
        ref={playerShellRef}
        className={mergeClasses(
          'shadow-media-player fixed right-0 bottom-0 left-0 isolate z-50 w-full pt-2',
          playerHandler.state.settings.amoledPlayerSurfaces ? 'bg-black' : 'bg-primary',
          isDesktop ? 'h-40 px-4 pb-4' : mergeClasses('px-2 pb-1', isPlayerDetailsExpanded ? 'min-h-[11.875rem]' : 'min-h-[8.75rem]')
        )}
        style={accentStyle}
      >
        {hasAccentColor ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}

        {isDesktop ? (
          <div className="relative z-[1]">
            <div className="absolute top-0 left-0 flex min-w-0 items-start gap-4">
              <PlayerMetadataBlock
                streamLibraryItem={streamLibraryItem}
                metadata={metadata}
                coverAspectRatio={coverAspectRatio}
                coverWidth={77}
                onCoverActivate={openFullscreen}
              />
            </div>
            {/* No expand button: the artwork opens fullscreen, the way audiobook and podcast
                players usually do it, and it is a far larger target than an icon */}
            <div className="absolute top-0 right-0 flex items-center gap-1">
              <IconBtn size="small" borderless onClick={clearStreamMedia} ariaLabel={t('LabelClosePlayer')}>
                close
              </IconBtn>
            </div>
            <div className="flex flex-col gap-3">
              <PlayerControls controls={controlsState} />
              <PlayerTrackBar playerHandler={playerHandler} variant="full" rounded />
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

      {isFullscreenMounted && (
        <PlayerFullscreen
          controls={controlsState}
          metadata={metadata}
          onMinimize={closeFullscreen}
          onClosePlayer={clearStreamMedia}
          isExiting={isFullscreenExiting}
        />
      )}

      <PlayerModals controls={controlsState} />
    </>
  )
}
