'use client'

import { useLibraries } from '@/contexts/LibrariesContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useLandscapePlayerDensity } from '@/hooks/useLandscapePlayerDensity'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePlayerFullscreenHistory } from '@/hooks/usePlayerFullscreenHistory'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { usePlayerShellSwipe } from '@/hooks/usePlayerShellSwipe'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { landscapeDensityFlags } from '@/lib/player/landscapeDensity'
import { isPlayerShellExpandClick } from '@/lib/player/playerShellSwipe'
import { closePlayerSecondaryPopovers } from '@/lib/player/secondaryPopovers'
import { LibraryItem } from '@/types/api'
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import IconBtn from '../ui/IconBtn'
import './player-shell.css'
import PlayerCover from './PlayerCover'
import PlayerModals from './PlayerModals'
import PlayerSecondaryToolbar from './PlayerSecondaryToolbar'
import PlayerTitleAuthor, { type PlayerMetadataDisplay } from './PlayerTitleAuthor'
import PlayerTrackBar from './PlayerTrackBar'
import PlayerTransportControls from './PlayerTransportControls'
import { usePlayerControlsState } from './usePlayerControlsState'

const SHELL_MINI =
  'inset-x-0 bottom-0 z-50 h-(--player-mini-h) cursor-pointer ' +
  'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[var(--cover-h-mini)_var(--mini-track-stack)] ' +
  'content-start items-center gap-y-(--mini-pad) pt-(--mini-pad) ps-(--mini-ps) pe-(--mini-pe) pb-(--mini-pb) ' +
  'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
const LEAD_MINI = 'col-start-1 row-start-1 flex min-w-0 items-center justify-start gap-(--mini-title-gap)'
const END_MINI = 'col-start-3 row-start-1 hidden min-w-0 self-stretch lg:grid'
const SHELL_FS = 'fullscreen inset-0 z-90 flex h-dvh max-h-dvh min-h-dvh flex-col overscroll-none pt-(--fs-pt) ps-(--fs-ps) pe-(--fs-pe) pb-(--fs-pb)'
const SHELL_LANDSCAPE = 'grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] items-center gap-x-(--landscape-pad)'

const BODY_FS = 'grid min-h-0 w-full min-w-0 flex-auto grid-rows-[minmax(0,1fr)_auto] items-center gap-(--fs-gap)'
const BODY_LANDSCAPE = 'contents'

const COLUMN_FS = 'row-start-2 flex w-full min-w-0 flex-none flex-col self-end gap-(--fs-gap) lg:items-center'
/* Do not flex-shrink sections — escalate density instead of squashing title/metadata. */
const COLUMN_LANDSCAPE =
  'col-start-2 row-start-2 max-h-full min-h-0 w-full min-w-(--landscape-col) max-w-full justify-start self-center justify-self-stretch overflow-hidden *:min-w-0 *:shrink-0'

/* Sticks 0.5rem further out than the body so the buttons stay on the outer insets. */
const HEADER_FS = 'z-4 flex h-(--fs-header-h) shrink-0 items-center justify-between -ms-(--fs-header-outset) -me-(--fs-header-outset)'
const HEADER_LANDSCAPE = 'col-span-2 row-start-1'
const CLOSE_MINI = 'z-4 col-start-1 row-start-1 self-start justify-self-end'
const HEADER_BTN_FS = 'inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center p-0'
const HEADER_COLLAPSE_ICON_FS = 'text-3xl leading-none'
const HEADER_CLOSE_ICON_FS = 'text-2xl leading-none'

const TRACK_STACK = 'flex flex-col'
const TRACK_STACK_MINI = 'z-2 col-span-full row-start-2 min-w-0 self-start'
/* Keep chapter timestamps grouped with the chapter slider, not the book track. */
const TRACK_STACK_FS = 'static inset-auto bottom-auto w-full gap-4 lg:w-3/4 lg:max-w-3xl'
const TRACK_MINI = 'text-xs lg:text-sm'
const TRACK_FS = 'text-sm'
const TRACK_BOOK = 'max-h-32 overflow-hidden opacity-100 visible pointer-events-auto'

const TRANSPORT = 'flex items-center'
const TRANSPORT_MINI = 'z-2 col-start-2 row-start-1 w-max justify-self-end lg:justify-self-center'
const TRANSPORT_FS = 'static inset-auto top-auto bottom-auto h-auto w-full justify-center pe-0 opacity-100 visible pointer-events-auto'

const TOOLBAR = 'flex'
/* Toolbar spans the shell width and sits above the cover — pass clicks through except on controls. */
const TOOLBAR_MINI = 'col-start-1 row-start-1 self-center justify-self-end items-center justify-end lg:pe-(--mini-toolbar-pe)'
const TOOLBAR_FS = 'static z-6 inset-auto bottom-auto h-auto w-full items-center justify-center pe-0 opacity-100 visible pointer-events-auto'

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
  const swipeHandledRef = useRef(false)

  const useChapterTrack = playerHandler.state.settings.useChapterTrack && playerHandler.state.chapters.length > 0
  const layoutKey = `${streamLibraryItem.id}:${useChapterTrack}`
  const landscapeDensityLevel = useLandscapePlayerDensity(shellRef, rightColumnRef, layoutKey)
  const landscapeDensity = landscapeDensityFlags(landscapeDensityLevel)
  const showBookTrack = isPlayerFullscreen && useChapterTrack && !landscapeDensity.singleTrackBar
  const chapterLabelPlacement = landscapeDensity.chapterLabelBelow || !isPlayerFullscreen ? 'below' : 'above'

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
      if (controlsState.isAnyModalOpen || isSecondaryPopoverOpen) return
      if (swipeHandledRef.current) {
        swipeHandledRef.current = false
        return
      }
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
      className={HEADER_BTN_FS}
      iconClass={HEADER_COLLAPSE_ICON_FS}
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
      className={isPlayerFullscreen ? HEADER_BTN_FS : undefined}
      iconClass={isPlayerFullscreen ? HEADER_CLOSE_ICON_FS : undefined}
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
      className={mergeClasses(
        'player-shell bg-primary shadow-media-player fixed isolate w-full touch-none overflow-hidden',
        isPlayerFullscreen ? mergeClasses(SHELL_FS, isLandscapeCompact && SHELL_LANDSCAPE) : SHELL_MINI
      )}
      style={shellStyle}
      data-cy="player-shell"
      data-landscape-density={landscapeDensityLevel}
      role={isPlayerFullscreen ? 'dialog' : undefined}
      aria-label={isPlayerFullscreen ? metadata.displayTitle : undefined}
      onClick={isPlayerFullscreen ? undefined : handleMiniBackgroundClick}
    >
      {showAccentBackdrop ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}

      {isPlayerFullscreen ? (
        <div className={mergeClasses(HEADER_FS, isLandscapeCompact && HEADER_LANDSCAPE)}>
          <div className="player-header-collapse" data-cy="player-header-collapse">
            {collapseBtn}
          </div>
          <div className="player-header-close" data-cy="player-header-close">
            {closeBtn}
          </div>
        </div>
      ) : null}

      <div className={isPlayerFullscreen ? mergeClasses(BODY_FS, isLandscapeCompact && BODY_LANDSCAPE) : 'contents'} data-cy="player-fullscreen-body">
        <div className={isPlayerFullscreen ? 'contents' : LEAD_MINI}>
          <PlayerCover streamLibraryItem={streamLibraryItem} coverAspectRatio={coverAspectRatio} onActivate={handleCoverActivate} />
          {!isPlayerFullscreen ? titleAuthor : null}
        </div>
        <div
          ref={rightColumnRef}
          className={mergeClasses('player-right-column', isPlayerFullscreen ? mergeClasses(COLUMN_FS, isLandscapeCompact && COLUMN_LANDSCAPE) : 'contents')}
          data-cy="player-right-column"
        >
          {isPlayerFullscreen ? titleAuthor : null}

          <div
            className={mergeClasses(
              'player-track-stack',
              TRACK_STACK,
              isPlayerFullscreen ? TRACK_STACK_FS : TRACK_STACK_MINI,
              showBookTrack && 'player-track-stack--dual'
            )}
            data-cy="player-track-stack"
          >
            <div className={mergeClasses('player-track player-track-primary', isPlayerFullscreen ? TRACK_FS : TRACK_MINI)}>
              <PlayerTrackBar playerHandler={playerHandler} chapterLabelPlacement={chapterLabelPlacement} deferTouchSeekToShellGestures dual={showBookTrack} />
            </div>
            {showBookTrack ? (
              <div className={mergeClasses('player-track player-track-book', TRACK_FS, TRACK_BOOK)}>
                <PlayerTrackBar playerHandler={playerHandler} scope="book" deferTouchSeekToShellGestures dual />
              </div>
            ) : null}
          </div>

          <div className={mergeClasses('player-transport-slot', TRANSPORT, isPlayerFullscreen ? TRANSPORT_FS : TRANSPORT_MINI)} data-cy="player-transport-slot">
            <PlayerTransportControls controls={controlsState} variant={transportVariant} />
          </div>
          <div className={isPlayerFullscreen ? 'contents' : END_MINI}>
            {!landscapeDensity.overflowSecondaryToolbar ? (
              <div className={mergeClasses('player-toolbar-slot', TOOLBAR, isPlayerFullscreen ? TOOLBAR_FS : TOOLBAR_MINI)} data-cy="player-toolbar-slot">
                <PlayerSecondaryToolbar
                  controls={controlsState}
                  onPlaybackRateOpenChange={setPlaybackRatePopoverOpen}
                  onVolumeOpenChange={setVolumePopoverOpen}
                />
              </div>
            ) : null}
            {!isPlayerFullscreen && isDesktop ? (
              <div className={mergeClasses('player-header-close', CLOSE_MINI)} data-cy="player-header-close">
                {closeBtn}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <PlayerModals controls={controlsState} />
    </div>
  )
}
