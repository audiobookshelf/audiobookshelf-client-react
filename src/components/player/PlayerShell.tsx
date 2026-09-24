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

const PLAYER_SHELL_MINI_CLASS = 'inset-x-0 bottom-0 z-50 h-(--media-player-mini-height) cursor-pointer'

const PLAYER_SHELL_FULLSCREEN_CLASS = mergeClasses(
  'fullscreen inset-0 z-90 flex h-dvh max-h-dvh min-h-dvh flex-col overscroll-none pt-(--fs-pt) ps-(--fs-ps) pe-(--fs-pe) pb-(--fs-pb)',
  'pslc:grid pslc:grid-cols-[auto_minmax(0,1fr)] pslc:grid-rows-[minmax(0,1fr)] pslc:items-center pslc:gap-x-(--player-landscape-inline-pad)'
)

const PLAYER_FULLSCREEN_BODY_CLASS = mergeClasses(
  'grid min-h-0 w-full min-w-0 flex-auto grid-rows-[minmax(0,1fr)_auto] items-center gap-(--player-fullscreen-section-gap)',
  'pslc:contents'
)

const PLAYER_RIGHT_COLUMN_FULLSCREEN_CLASS = mergeClasses(
  'row-start-2 flex w-full min-w-0 flex-none flex-col self-end gap-(--player-fullscreen-section-gap) lg:items-center',
  /* Do not flex-shrink sections — escalate density instead of squashing title/metadata. */
  'pslc:col-start-2 pslc:row-start-1 pslc:max-h-full pslc:min-h-0 pslc:w-(--player-landscape-col-width,100%) pslc:min-w-0 pslc:max-w-full pslc:justify-start pslc:self-center pslc:justify-self-center pslc:overflow-hidden pslc:*:min-w-0 pslc:*:shrink-0'
)

const PLAYER_CHROME_CLASS = 'absolute z-4 top-(--player-mini-top-pad)'
const PLAYER_CHROME_START_MINI_CLASS = 'start-1 opacity-0 invisible pointer-events-none'
const PLAYER_CHROME_START_FULLSCREEN_CLASS = 'top-(--chrome-fs-top) start-(--chrome-fs-ps) opacity-100 visible pointer-events-auto'
const PLAYER_CHROME_END_MINI_CLASS = 'end-2 opacity-0 invisible pointer-events-none lg:end-(--chrome-lg-pe) lg:opacity-100 lg:visible lg:pointer-events-auto'
const PLAYER_CHROME_END_FULLSCREEN_CLASS = 'top-(--chrome-fs-top) end-(--chrome-fs-pe) opacity-100 visible pointer-events-auto'
const PLAYER_CHROME_BTN_FULLSCREEN_CLASS = 'inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center p-0'
const PLAYER_CHROME_START_ICON_FULLSCREEN_CLASS = 'text-3xl leading-none'
const PLAYER_CHROME_END_ICON_FULLSCREEN_CLASS = 'text-2xl leading-none'

const PLAYER_TRACK_STACK_CLASS = 'flex flex-col'
const PLAYER_TRACK_STACK_MINI_CLASS = 'absolute z-2 gap-1.5 start-(--track-ps) end-(--track-pe) bottom-(--track-pb)'
/* Keep chapter timestamps grouped with the chapter slider, not the book track. */
const PLAYER_TRACK_STACK_FULLSCREEN_CLASS = 'static inset-auto bottom-auto w-full gap-4 lg:w-3/4 lg:max-w-3xl'
const PLAYER_TRACK_MINI_CLASS = 'text-xs lg:text-sm'
const PLAYER_TRACK_FULLSCREEN_CLASS = 'text-sm'
const PLAYER_TRACK_BOOK_CLASS = 'max-h-32 overflow-hidden opacity-100 visible pointer-events-auto'

const PLAYER_TRANSPORT_SLOT_CLASS = 'flex items-center'
const PLAYER_TRANSPORT_SLOT_MINI_CLASS = mergeClasses(
  'absolute z-2 start-auto end-(--player-safe-inline-end) top-(--player-mini-content-top) bottom-auto h-(--cover-image-height-collapsed) w-(--player-mini-transport-width) justify-end pe-2',
  'lg:pointer-events-none lg:*:pointer-events-auto lg:start-0 lg:end-0 lg:w-full lg:justify-center lg:pe-10 xl:pe-0'
)
const PLAYER_TRANSPORT_SLOT_FULLSCREEN_CLASS =
  'static inset-auto top-auto bottom-auto h-auto w-full justify-center pe-0 opacity-100 visible pointer-events-auto'

const PLAYER_TOOLBAR_SLOT_CLASS = 'flex'
/* Toolbar spans the shell width and sits above the cover — pass clicks through except on controls. */
const PLAYER_TOOLBAR_SLOT_MINI_CLASS = mergeClasses(
  'absolute z-2 start-0 end-0 bottom-2 justify-center opacity-0 invisible pointer-events-none',
  'lg:start-auto lg:end-(--toolbar-lg-pe) lg:top-(--player-mini-content-top) lg:bottom-auto lg:h-(--cover-image-height-collapsed) lg:w-auto lg:items-center lg:justify-end lg:opacity-100 lg:visible lg:pointer-events-none lg:*:pointer-events-auto'
)
const PLAYER_TOOLBAR_SLOT_FULLSCREEN_CLASS =
  'static z-6 inset-auto bottom-auto h-auto w-full items-center justify-center pe-0 opacity-100 visible pointer-events-auto'

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
  const showBookTrack = isPlayerFullscreen && useChapterTrack && !landscapeDensity.singleTrackBar
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
      className={mergeClasses(
        'player-shell bg-primary shadow-media-player fixed isolate w-full touch-none overflow-hidden',
        isPlayerFullscreen ? PLAYER_SHELL_FULLSCREEN_CLASS : PLAYER_SHELL_MINI_CLASS
      )}
      style={shellStyle}
      data-cy="player-shell"
      data-landscape-density={landscapeDensityLevel}
      role={isPlayerFullscreen ? 'dialog' : undefined}
      aria-label={isPlayerFullscreen ? metadata.displayTitle : undefined}
      onClick={isPlayerFullscreen ? undefined : handleMiniBackgroundClick}
    >
      {showAccentBackdrop ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}

      <div
        className={mergeClasses(
          'player-chrome-start',
          PLAYER_CHROME_CLASS,
          isPlayerFullscreen ? PLAYER_CHROME_START_FULLSCREEN_CLASS : PLAYER_CHROME_START_MINI_CLASS
        )}
        data-cy="player-chrome-start"
        aria-hidden={!isPlayerFullscreen}
      >
        <IconBtn
          ref={collapseBtnRef}
          size="small"
          borderless
          className={isPlayerFullscreen ? PLAYER_CHROME_BTN_FULLSCREEN_CLASS : undefined}
          iconClass={isPlayerFullscreen ? PLAYER_CHROME_START_ICON_FULLSCREEN_CLASS : undefined}
          tabIndex={isPlayerFullscreen ? undefined : -1}
          onClick={collapse}
          ariaLabel={t('LabelCollapsePlayer')}
        >
          expand_more
        </IconBtn>
      </div>
      <div
        className={mergeClasses(
          'player-chrome-end',
          PLAYER_CHROME_CLASS,
          isPlayerFullscreen ? PLAYER_CHROME_END_FULLSCREEN_CLASS : PLAYER_CHROME_END_MINI_CLASS
        )}
        data-cy="player-chrome-end"
        aria-hidden={!isPlayerFullscreen && !isDesktop}
      >
        <IconBtn
          size="small"
          borderless
          className={isPlayerFullscreen ? PLAYER_CHROME_BTN_FULLSCREEN_CLASS : undefined}
          iconClass={isPlayerFullscreen ? PLAYER_CHROME_END_ICON_FULLSCREEN_CLASS : undefined}
          tabIndex={isPlayerFullscreen || isDesktop ? undefined : -1}
          onClick={onClose}
          ariaLabel={t('LabelClosePlayer')}
        >
          close
        </IconBtn>
      </div>

      <div className={isPlayerFullscreen ? PLAYER_FULLSCREEN_BODY_CLASS : 'contents'} data-cy="player-fullscreen-body">
        <PlayerCover
          streamLibraryItem={streamLibraryItem}
          coverAspectRatio={coverAspectRatio}
          isFullscreen={isPlayerFullscreen}
          onActivate={handleCoverActivate}
        />
        <div
          ref={rightColumnRef}
          className={mergeClasses('player-right-column', isPlayerFullscreen ? PLAYER_RIGHT_COLUMN_FULLSCREEN_CLASS : 'contents')}
          data-cy="player-right-column"
        >
          <PlayerTitleAuthor
            streamLibraryItem={streamLibraryItem}
            metadata={metadata}
            isFullscreen={isPlayerFullscreen}
            onNavigateAway={collapseForNavigation}
            compact={landscapeDensity.compactTitle}
          />

          <div
            className={mergeClasses(
              'player-track-stack',
              PLAYER_TRACK_STACK_CLASS,
              isPlayerFullscreen ? PLAYER_TRACK_STACK_FULLSCREEN_CLASS : PLAYER_TRACK_STACK_MINI_CLASS,
              showBookTrack && 'player-track-stack--dual'
            )}
            data-cy="player-track-stack"
          >
            <div className={mergeClasses('player-track player-track-primary', isPlayerFullscreen ? PLAYER_TRACK_FULLSCREEN_CLASS : PLAYER_TRACK_MINI_CLASS)}>
              <PlayerTrackBar playerHandler={playerHandler} chapterLabelPlacement={chapterLabelPlacement} deferTouchSeekToShellGestures dual={showBookTrack} />
            </div>
            {showBookTrack ? (
              <div className={mergeClasses('player-track player-track-book', PLAYER_TRACK_FULLSCREEN_CLASS, PLAYER_TRACK_BOOK_CLASS)}>
                <PlayerTrackBar playerHandler={playerHandler} scope="book" deferTouchSeekToShellGestures dual />
              </div>
            ) : null}
          </div>

          <div
            className={mergeClasses(
              'player-transport-slot',
              PLAYER_TRANSPORT_SLOT_CLASS,
              isPlayerFullscreen ? PLAYER_TRANSPORT_SLOT_FULLSCREEN_CLASS : PLAYER_TRANSPORT_SLOT_MINI_CLASS
            )}
            data-cy="player-transport-slot"
          >
            <PlayerTransportControls controls={controlsState} variant={transportVariant} isFullscreen={isPlayerFullscreen} />
          </div>
          {!landscapeDensity.overflowSecondaryToolbar ? (
            <div
              className={mergeClasses(
                'player-toolbar-slot',
                PLAYER_TOOLBAR_SLOT_CLASS,
                isPlayerFullscreen ? PLAYER_TOOLBAR_SLOT_FULLSCREEN_CLASS : PLAYER_TOOLBAR_SLOT_MINI_CLASS
              )}
              data-cy="player-toolbar-slot"
            >
              <PlayerSecondaryToolbar
                controls={controlsState}
                isFullscreen={isPlayerFullscreen}
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
