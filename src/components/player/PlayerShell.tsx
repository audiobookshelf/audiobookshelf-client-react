'use client'

import { useLibraries } from '@/contexts/LibrariesContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useLandscapePlayerDensity } from '@/hooks/useLandscapePlayerDensity'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePlayerFullscreenHistory } from '@/hooks/usePlayerFullscreenHistory'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { closePlayerSecondaryPopovers } from '@/hooks/usePlayerSecondaryPopoverDismiss'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { usePlayerShellSwipe } from '@/hooks/usePlayerShellSwipe'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { trapTabKey } from '@/lib/focusTrap'
import { landscapeDensityFlags } from '@/lib/player/landscapeDensity'
import { isPlayerShellExpandClick } from '@/lib/player/playerShellSwipe'
import { LibraryItem } from '@/types/api'
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import IconBtn from '../ui/IconBtn'
import './player-shell.css'
import PlayerCover from './PlayerCover'
import PlayerModals from './PlayerModals'
import {
  playerBodyClass,
  playerBookTrackClass,
  playerCloseIconClass,
  playerCollapseIconClass,
  playerEndSlotClass,
  playerHeaderButtonClass,
  playerHeaderClass,
  playerLeadClass,
  playerMiniCloseClass,
  playerPrimaryTrackClass,
  playerRightColumnClass,
  playerShellClass,
  playerShellVariant,
  playerToolbarSlotClass,
  playerTrackStackClass,
  playerTransportSlotClass
} from './playerShellClasses'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTitleAuthor, { type PlayerMetadataDisplay } from './PlayerTitleAuthor'
import PlayerTrackBar from './PlayerTrackBar'
import PlayerTransportControls from './PlayerTransportControls'
import { usePlayerControlsState } from './usePlayerControlsState'

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
  const { getCoverAspectRatio } = useLibraries()
  const coverAspectRatio = getCoverAspectRatio(streamLibraryItem.libraryId)
  const isDesktop = useMediaQuery('lg')
  const { isPlayerFullscreen, isLandscapeCompact } = usePlayerShellLayout()
  const layout = playerShellVariant(isPlayerFullscreen, isLandscapeCompact)
  const isMini = layout === 'mini'
  const { setPlayerFullscreen } = useMediaContext()
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
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const useChapterTrack = playerHandler.state.settings.useChapterTrack && playerHandler.state.chapters.length > 0
  const layoutKey = `${streamLibraryItem.id}:${useChapterTrack}`
  const landscapeDensityLevel = useLandscapePlayerDensity(shellRef, rightColumnRef, layoutKey)
  const appliedLandscapeDensityLevel = layout === 'landscape' ? landscapeDensityLevel : 0
  const landscapeDensity = landscapeDensityFlags(appliedLandscapeDensityLevel)
  const showBookTrack = isPlayerFullscreen && useChapterTrack && !landscapeDensity.singleTrackBar
  const chapterLabelPlacement = landscapeDensity.chapterLabelBelow || !isPlayerFullscreen ? 'below' : 'above'

  useLayoutEffect(() => {
    if (!isPlayerFullscreen) return

    const previous = document.activeElement
    if (previous instanceof HTMLElement && previous !== document.body) {
      previousFocusRef.current = previous
    }
    collapseBtnRef.current?.focus()

    return () => {
      const restore = previousFocusRef.current
      previousFocusRef.current = null
      if (restore?.isConnected) restore.focus()
    }
  }, [isPlayerFullscreen])

  useEffect(() => {
    if (!isPlayerFullscreen || controlsState.isAnyModalOpen || isSecondaryPopoverOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      trapTabKey(event, shellRef.current, collapseBtnRef.current)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [controlsState.isAnyModalOpen, isPlayerFullscreen, isSecondaryPopoverOpen])

  const expand = useCallback(() => {
    if (!isPlayerFullscreen) setPlayerFullscreen(true)
  }, [isPlayerFullscreen, setPlayerFullscreen])

  usePlayerShellSwipe(shellRef, {
    isPlayerFullscreen,
    onExpand: expand,
    onCollapse: collapse,
    onClose
  })

  const handleMiniBackgroundClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isPlayerFullscreen) return
      if (controlsState.isAnyModalOpen || isSecondaryPopoverOpen) return
      // Portaled overlays (queue, settings, …) still bubble through this React tree.
      if (!isPlayerShellExpandClick(event.target, shellRef.current)) return
      expand()
    },
    [controlsState.isAnyModalOpen, expand, isPlayerFullscreen, isSecondaryPopoverOpen]
  )

  const titleAuthor = (
    <PlayerTitleAuthor
      streamLibraryItem={streamLibraryItem}
      metadata={metadata}
      onNavigateAway={collapseForNavigation}
      compact={landscapeDensity.compactTitle}
    />
  )

  const collapseBtn = (
    <IconBtn
      ref={collapseBtnRef}
      size="small"
      borderless
      className={playerHeaderButtonClass(layout)}
      iconClass={playerCollapseIconClass(layout)}
      onClick={collapse}
      ariaLabel={t('LabelCollapsePlayer')}
    >
      expand_more
    </IconBtn>
  )

  const closeBtn = (
    <IconBtn
      size="small"
      borderless
      className={playerHeaderButtonClass(layout)}
      iconClass={playerCloseIconClass(layout)}
      onClick={onClose}
      ariaLabel={t('LabelClosePlayer')}
    >
      close
    </IconBtn>
  )

  const shellStyle = useMemo(
    () =>
      ({
        ...accentStyle,
        '--cover-aspect': coverAspectRatio
      }) as CSSProperties,
    [accentStyle, coverAspectRatio]
  )

  return (
    <div
      ref={shellRef}
      className={playerShellClass(layout)}
      style={shellStyle}
      data-cy="player-shell"
      data-landscape-density={appliedLandscapeDensityLevel}
      role={!isMini ? 'dialog' : undefined}
      aria-modal={!isMini ? true : undefined}
      aria-label={!isMini ? metadata.displayTitle : undefined}
      onClick={isMini ? handleMiniBackgroundClick : undefined}
    >
      {showAccentBackdrop && <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" />}

      {!isMini && (
        <div className={playerHeaderClass(layout)}>
          <div className="player-header-collapse" data-cy="player-header-collapse">
            {collapseBtn}
          </div>
          <div className="player-header-close" data-cy="player-header-close">
            {closeBtn}
          </div>
        </div>
      )}

      <div className={playerBodyClass(layout)} data-cy="player-fullscreen-body">
        <div className={playerLeadClass(layout)}>
          <PlayerCover streamLibraryItem={streamLibraryItem} coverAspectRatio={coverAspectRatio} onActivate={expand} />
          {isMini && titleAuthor}
        </div>
        <div ref={rightColumnRef} className={playerRightColumnClass(layout)} data-cy="player-right-column">
          {!isMini && titleAuthor}

          <div className={playerTrackStackClass(layout, showBookTrack)} data-cy="player-track-stack">
            <div className={playerPrimaryTrackClass(layout)}>
              <PlayerTrackBar playerHandler={playerHandler} chapterLabelPlacement={chapterLabelPlacement} deferTouchSeekToShellGestures dual={showBookTrack} />
            </div>
            {showBookTrack && (
              <div className={playerBookTrackClass()}>
                <PlayerTrackBar playerHandler={playerHandler} scope="book" deferTouchSeekToShellGestures dual />
              </div>
            )}
          </div>

          <div className={playerTransportSlotClass(layout)} data-cy="player-transport-slot">
            <PlayerTransportControls controls={controlsState} variant={transportVariant} />
          </div>
          <div className={playerEndSlotClass(layout)}>
            {!landscapeDensity.overflowSecondaryToolbar && (
              <div className={playerToolbarSlotClass(layout)} data-cy="player-toolbar-slot">
                <PlayerSecondaryToolbar
                  controls={controlsState}
                  onPlaybackRateOpenChange={setPlaybackRatePopoverOpen}
                  onVolumeOpenChange={setVolumePopoverOpen}
                />
              </div>
            )}
            {isMini && isDesktop && (
              <div className={playerMiniCloseClass()} data-cy="player-header-close">
                {closeBtn}
              </div>
            )}
          </div>
        </div>
      </div>

      <PlayerModals controls={controlsState} />
    </div>
  )
}
