'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { useFullscreenCoverLayout } from '@/hooks/useFullscreenCoverLayout'
import { useLandscapePlayerDensity } from '@/hooks/useLandscapePlayerDensity'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePlayerCoverAspectRatio } from '@/hooks/usePlayerCoverAspectRatio'
import { usePlayerFullscreenHistory } from '@/hooks/usePlayerFullscreenHistory'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { usePlayerShellSwipe } from '@/hooks/usePlayerShellSwipe'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { landscapeDensityFlags } from '@/lib/player/landscapeDensity'
import { isPlayerShellExpandIgnoredTarget } from '@/lib/player/playerShellSwipe'
import { closePlayerSecondaryPopovers } from '@/lib/player/secondaryPopovers'
import { LibraryItem } from '@/types/api'
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import IconBtn from '../ui/IconBtn'
import PlayerCover from './PlayerCover'
import PlayerModals from './PlayerModals'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTitleAuthor, { type PlayerMetadataDisplay } from './PlayerTitleAuthor'
import PlayerTrackBar from './PlayerTrackBar'
import PlayerTransportControls from './PlayerTransportControls'
import { usePlayerControlsState } from './usePlayerControlsState'
import './player-shell.css'

interface PlayerShellProps {
  playerHandler: PlayerHandler
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  accentStyle?: CSSProperties
  showAccentBackdrop: boolean
  onClose: () => void
}

export default function PlayerShell({ playerHandler, streamLibraryItem, metadata, accentStyle, showAccentBackdrop, onClose }: PlayerShellProps) {
  const t = useTypeSafeTranslations()
  const coverAspectRatio = usePlayerCoverAspectRatio(streamLibraryItem.libraryId)
  const isDesktop = useMediaQuery('lg')
  const { isPlayerFullscreen, setPlayerFullscreen } = useMediaContext()
  const transportVariant = isPlayerFullscreen || isDesktop ? 'full' : 'mini'
  const controlsState = usePlayerControlsState(playerHandler, streamLibraryItem)
  const { closeAllModals } = controlsState
  const [playbackRatePopoverOpen, setPlaybackRatePopoverOpen] = useState(false)
  const [volumePopoverOpen, setVolumePopoverOpen] = useState(false)
  const isSecondaryPopoverOpen = playbackRatePopoverOpen || volumePopoverOpen

  const closePlayerOverlays = useCallback(() => {
    closeAllModals()
    closePlayerSecondaryPopovers()
  }, [closeAllModals])

  const { collapse, collapseForNavigation } = usePlayerFullscreenHistory(isPlayerFullscreen, setPlayerFullscreen, {
    isOpen: controlsState.isAnyModalOpen || isSecondaryPopoverOpen,
    onClose: closePlayerOverlays
  })

  useEffect(() => {
    if (!isPlayerFullscreen) {
      closePlayerOverlays()
    }
  }, [closePlayerOverlays, isPlayerFullscreen])

  const shellRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)
  const collapseBtnRef = useRef<HTMLButtonElement>(null)
  const swipeHandledRef = useRef(false)

  const useChapterTrack = playerHandler.state.settings.useChapterTrack && playerHandler.state.chapters.length > 0
  const baseLayoutKey = `${streamLibraryItem.id}:${useChapterTrack}`
  const landscapeDensityLevel = useLandscapePlayerDensity(shellRef, rightColumnRef, isPlayerFullscreen, isDesktop, baseLayoutKey)
  const landscapeDensity = landscapeDensityFlags(landscapeDensityLevel)
  const showBookTrack = useChapterTrack && !landscapeDensity.singleTrackBar
  const chapterLabelPlacement = landscapeDensity.chapterLabelBelow || !isPlayerFullscreen ? 'below' : 'above'
  const layoutKey = `${baseLayoutKey}:${landscapeDensityLevel}:${chapterLabelPlacement}`
  const coverVars = useFullscreenCoverLayout(shellRef, coverAspectRatio, isPlayerFullscreen, isDesktop, layoutKey)

  useLayoutEffect(() => {
    if (isPlayerFullscreen) {
      collapseBtnRef.current?.focus()
    }
  }, [isPlayerFullscreen])

  const expand = useCallback(() => {
    if (!isPlayerFullscreen) setPlayerFullscreen(true)
  }, [isPlayerFullscreen, setPlayerFullscreen])

  const markSwipeHandled = useCallback(() => {
    swipeHandledRef.current = true
  }, [])

  usePlayerShellSwipe(shellRef, {
    isPlayerFullscreen,
    onExpand: expand,
    onCollapse: collapse,
    onClose,
    onSwipeHandled: markSwipeHandled
  })

  const handleCoverActivate = useCallback(() => {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false
      return
    }
    expand()
  }, [expand])

  const handleMiniBackgroundClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isPlayerFullscreen) return
      if (swipeHandledRef.current) {
        swipeHandledRef.current = false
        return
      }
      if (isPlayerShellExpandIgnoredTarget(event.target)) return
      expand()
    },
    [expand, isPlayerFullscreen]
  )

  const shellStyle = useMemo(
    () => ({
      ...accentStyle,
      ...coverVars
    }),
    [accentStyle, coverVars]
  )

  return (
    <div
      ref={shellRef}
      className={mergeClasses('player-shell bg-primary shadow-media-player fixed inset-x-0 bottom-0 isolate w-full', isPlayerFullscreen && 'fullscreen')}
      style={shellStyle}
      data-cy="player-shell"
      data-landscape-density={landscapeDensityLevel}
      role={isPlayerFullscreen ? 'dialog' : undefined}
      aria-label={isPlayerFullscreen ? metadata.displayTitle : undefined}
      onClick={isPlayerFullscreen ? undefined : handleMiniBackgroundClick}
    >
      {showAccentBackdrop ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}

      <div className="player-chrome-start" aria-hidden={!isPlayerFullscreen}>
        <IconBtn
          ref={collapseBtnRef}
          size="small"
          borderless
          tabIndex={isPlayerFullscreen ? undefined : -1}
          onClick={collapse}
          ariaLabel={t('LabelCollapsePlayer')}
        >
          expand_more
        </IconBtn>
      </div>
      <div className="player-chrome-end" aria-hidden={!isPlayerFullscreen && !isDesktop}>
        <IconBtn size="small" borderless tabIndex={isPlayerFullscreen || isDesktop ? undefined : -1} onClick={onClose} ariaLabel={t('LabelClosePlayer')}>
          close
        </IconBtn>
      </div>

      <div className="player-fullscreen-body">
        <PlayerCover
          streamLibraryItem={streamLibraryItem}
          coverAspectRatio={coverAspectRatio}
          isFullscreen={isPlayerFullscreen}
          onActivate={handleCoverActivate}
        />
        <div ref={rightColumnRef} className="player-right-column">
          <PlayerTitleAuthor
            streamLibraryItem={streamLibraryItem}
            metadata={metadata}
            isFullscreen={isPlayerFullscreen}
            onNavigateAway={collapseForNavigation}
            compact={landscapeDensity.compactTitle}
          />

          <div className="player-track-stack">
            <div className="player-track player-track-primary">
              <PlayerTrackBar playerHandler={playerHandler} chapterLabelPlacement={chapterLabelPlacement} deferTouchSeekToShellGestures />
            </div>
            {showBookTrack ? (
              <div className="player-track player-track-book">
                <PlayerTrackBar playerHandler={playerHandler} scope="book" deferTouchSeekToShellGestures />
              </div>
            ) : null}
          </div>

          <div className="player-transport-slot">
            <PlayerTransportControls controls={controlsState} variant={transportVariant} />
          </div>
          {!landscapeDensity.overflowSecondaryToolbar ? (
            <div className="player-toolbar-slot">
              <PlayerSecondaryToolbar
                controls={controlsState}
                onPlaybackRateOpenChange={setPlaybackRatePopoverOpen}
                onVolumeOpenChange={setVolumePopoverOpen}
              />
            </div>
          ) : null}
        </div>
      </div>

      <PlayerModals controls={controlsState} />
    </div>
  )
}
