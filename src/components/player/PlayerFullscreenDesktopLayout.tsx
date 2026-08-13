'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { VOLUME_HOTKEY_STEP } from '@/lib/player/constants'
import { usePlayerProgress } from '@/lib/player/playerProgressStore'
import { useCallback, useEffect, useRef, useState } from 'react'
import PlaybackRateWidget from './PlaybackRateWidget'
import PlayerCoverProgressRing from './PlayerCoverProgressRing'
import PlayerFullscreenArtwork, { useFittedCoverWidth, type JumpBurst } from './PlayerFullscreenArtwork'
import PlayerFullscreenBookmarksPanel from './PlayerFullscreenBookmarksPanel'
import PlayerFullscreenChapterPanel from './PlayerFullscreenChapterPanel'
import PlayerFullscreenTitle from './PlayerFullscreenTitle'
import PlayerFullscreenTrackStack from './PlayerFullscreenTrackStack'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerSpeedPill from './PlayerSpeedPill'
import SleepTimerWidget from './SleepTimerWidget'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'

interface PlayerFullscreenDesktopLayoutProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  coverSrc: string
  coverAspectRatio: number
  jumpBurst: JumpBurst | null
  onMinimize: () => void
}

const VOLUME_HUD_MS = 1400
/** Matches the artwork's `rounded-2xl`, so the progress ring stays concentric */
const COVER_RADIUS = 16
/** Room beside the artwork for the hover rail and the volume readout */
const COVER_SIDE_RESERVE = 130
/** Room under the artwork for the title, authors and duration */
const TITLE_BLOCK_RESERVE = 116
/** Same cap the Vue client uses — keeps the artwork in proportion to the window */
const COVER_VIEWPORT_HEIGHT_FRACTION = 0.5

function getVolumeIcon(volume: number): string {
  if (volume === 0) return 'volume_off'
  if (volume < 0.5) return 'volume_down'
  return 'volume_up'
}

/**
 * Desktop fullscreen. Chosen only when the primary input can hover, which is what makes the
 * two pointer-only affordances here safe to use:
 *
 * - The ring around the artwork is a scrub control. It was removed from the touch layouts
 *   because a thumb resting on the artwork edge could seek by accident; a mouse cannot do
 *   that, and the ring is the only way to scrub without leaving the artwork.
 * - The secondary controls live on a rail beside the artwork that reveals on hover, so the
 *   view is just artwork and title at rest. Everything reachable in the mini player is here:
 *   the rail carries volume, speed, sleep and bookmarks, the bottom bar carries chapters,
 *   queue and settings.
 */
export default function PlayerFullscreenDesktopLayout({
  controls,
  metadata,
  coverSrc,
  coverAspectRatio,
  jumpBurst,
  onMinimize
}: PlayerFullscreenDesktopLayoutProps) {
  const {
    playerHandler,
    streamLibraryItem,
    chapters,
    bookmarks,
    isPodcast,
    seek,
    openBookmarksModal,
    playerQueueItems,
    sleepTimer,
    setIsQueueModalOpen,
    setIsSettingsModalOpen,
    t
  } = controls

  const { volume, duration, currentChapter, settings } = playerHandler.state
  const { setVolume, toggleMute } = playerHandler.controls
  const { currentTime } = usePlayerProgress()
  const playbackRate = settings.playbackRate && !Number.isNaN(settings.playbackRate) ? settings.playbackRate : 1

  const stageRef = useRef<HTMLDivElement>(null)
  const coverWidth = useFittedCoverWidth(stageRef, coverAspectRatio, TITLE_BLOCK_RESERVE, COVER_SIDE_RESERVE, COVER_VIEWPORT_HEIGHT_FRACTION)

  const [isChapterPanelOpen, setIsChapterPanelOpen] = useState(false)
  const [isBookmarksPanelOpen, setIsBookmarksPanelOpen] = useState(false)
  const closeChapterPanel = useCallback(() => setIsChapterPanelOpen(false), [])
  const closeBookmarksPanel = useCallback(() => setIsBookmarksPanelOpen(false), [])

  // The only volume readout in this layout — the rail button is a mute toggle, so nothing
  // else on screen shows the level
  const [isVolumeHudVisible, setIsVolumeHudVisible] = useState(false)
  const previousVolumeRef = useRef(volume)
  const volumeHudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (previousVolumeRef.current === volume) return
    previousVolumeRef.current = volume

    setIsVolumeHudVisible(true)
    if (volumeHudTimeoutRef.current) clearTimeout(volumeHudTimeoutRef.current)
    volumeHudTimeoutRef.current = setTimeout(() => setIsVolumeHudVisible(false), VOLUME_HUD_MS)
  }, [volume])

  useEffect(() => {
    return () => {
      if (volumeHudTimeoutRef.current) clearTimeout(volumeHudTimeoutRef.current)
    }
  }, [])

  const volumePercent = Math.round(volume * 100)

  // A press anywhere outside a docked panel dismisses it — the artwork and the transport
  // controls are the rest of the view, and clicking either should not require closing the
  // panel first. The trigger buttons opt out, or their own toggle would immediately reopen
  // what this just closed.
  useEffect(() => {
    if (!isChapterPanelOpen && !isBookmarksPanelOpen) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target
      // Matched by attribute rather than by ref: the two panels are separate nodes on
      // opposite sides, and a single ref cannot cover both
      if (!(target instanceof Element)) return
      if (target.closest('[data-player-panel]') || target.closest('[data-player-panel-toggle]')) return

      setIsChapterPanelOpen(false)
      setIsBookmarksPanelOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isBookmarksPanelOpen, isChapterPanelOpen])

  // Escape closes an open side panel before anything else gets the key
  useEffect(() => {
    if (!isChapterPanelOpen && !isBookmarksPanelOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setIsChapterPanelOpen(false)
      setIsBookmarksPanelOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isBookmarksPanelOpen, isChapterPanelOpen])

  // Scrub preview from the ring — the readout replaces the artwork while a drag is live
  const [scrubPercent, setScrubPercent] = useState<number | null>(null)
  const progressPercent = duration ? Math.min(100, (100 * currentTime) / duration) : 0
  const displayTime = scrubPercent !== null ? (scrubPercent / 100) * duration : currentTime

  const handleScrubCommit = useCallback(
    (percent: number) => {
      if (!duration) return
      seek((percent / 100) * duration)
    },
    [duration, seek]
  )

  // Wheel over the volume button nudges it, which is what the popover slider used to be for
  const handleVolumeWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.deltaY === 0) return
      const next = e.deltaY < 0 ? volume + VOLUME_HOTKEY_STEP : volume - VOLUME_HOTKEY_STEP
      setVolume(Math.min(1, Math.max(0, next)))
    },
    [setVolume, volume]
  )

  const { sleepTimerSet, remainingString: sleepTimerRemainingString } = sleepTimer
  const sleepTimerLabel = sleepTimerSet ? `${t('LabelSleepTimer')}: ${sleepTimerRemainingString}` : t('LabelSleepTimer')
  const railBtnClass = 'flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/15'

  // Only one panel at a time: they dock on opposite sides, but two at once leaves the
  // artwork squeezed into whatever is left in the middle
  const handleBookmarksClick = useCallback(() => {
    if (settings.useLegacyBookmarksDialog) {
      openBookmarksModal()
      return
    }
    setIsChapterPanelOpen(false)
    setIsBookmarksPanelOpen((open) => !open)
  }, [openBookmarksModal, settings.useLegacyBookmarksDialog])

  return (
    <>
      <div className="player-fullscreen-pane relative z-10 flex min-h-0 grow">
        {/* Bookmarks dock at the start of the row, chapters at the end — mirror images, so
            neither has to move out of the way for the other */}
        <div
          data-player-panel
          inert={!isBookmarksPanelOpen}
          className={mergeClasses(
            'h-full shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
            isBookmarksPanelOpen ? 'w-96 max-w-full opacity-100' : 'w-0 opacity-0'
          )}
        >
          <div className="h-full w-96 max-w-full p-3 pe-0">
            <PlayerFullscreenBookmarksPanel
              bookmarks={bookmarks}
              currentTime={currentTime}
              libraryItemId={streamLibraryItem.id}
              playbackRate={playbackRate}
              isOpen={isBookmarksPanelOpen}
              amoled={settings.amoledPlayerSurfaces}
              onSelect={(bookmark) => seek(bookmark.time)}
              onClose={closeBookmarksPanel}
            />
          </div>
        </div>

        <div ref={stageRef} className="flex min-h-0 min-w-0 grow flex-col items-center justify-center gap-5 px-6 pt-16 pb-2">
          <PlayerFullscreenArtwork
            coverSrc={coverSrc}
            coverWidth={coverWidth}
            coverAspectRatio={coverAspectRatio}
            jumpBurst={jumpBurst}
            className="group"
            beforeCover={
              settings.showCoverProgressRing
                ? ({ coverWidth: width, coverHeight }) => (
                    <PlayerCoverProgressRing
                      coverWidth={width}
                      coverHeight={coverHeight}
                      coverRadius={COVER_RADIUS}
                      progressPercent={progressPercent}
                      disabled={!duration}
                      onScrubChange={setScrubPercent}
                      onScrubCommit={handleScrubCommit}
                    />
                  )
                : undefined
            }
          >
            {/* Scrub readout, over the artwork only while a drag is live */}
            <div
              className={mergeClasses(
                'pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 transition-opacity duration-200',
                scrubPercent !== null ? 'opacity-100' : 'opacity-0'
              )}
            >
              <p className="font-mono text-sm">
                {secondsToTimestamp(displayTime / playbackRate)} / {metadata.durationLabel}
              </p>
            </div>

            {isVolumeHudVisible && (
              <div aria-hidden="true" className="player-volume-hud pointer-events-none absolute end-full top-1/2 z-30 -translate-y-1/2 pe-5">
                <div className="flex w-11 flex-col items-center gap-2 rounded-full bg-black/55 py-3 ring-1 ring-white/15 backdrop-blur-md">
                  <span className="material-symbols text-xl leading-none">{getVolumeIcon(volume)}</span>
                  <div className="bg-track-bg relative h-28 w-1.5 overflow-hidden rounded-full">
                    <div
                      className="player-volume-hud-fill bg-track-progress absolute start-0 bottom-0 w-full rounded-full"
                      style={{ height: `${volumePercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] font-semibold tabular-nums">{volumePercent}</span>
                </div>
              </div>
            )}

            {/* ps-5 rather than ms-5 so the gap beside the artwork is part of the hover target.
                Focus-within as well as hover, so the rail is reachable by keyboard — the
                opacity is a `player-fab-stack` rule, never `pointer-events`, which is what
                made the first version of this rail dead to anything but a mouse. */}
            <div className="player-fab-stack absolute start-full top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 ps-5">
              {/* Mute toggle, not a popover: the readout beside the artwork already shows the
                  level, and a slider here would be the same control drawn twice. Arrow keys
                  and the wheel change the volume and surface that readout. */}
              <Tooltip text={volume === 0 ? t('LabelUnmute') : t('LabelMute')} position="left">
                <div className={railBtnClass}>
                  <IconBtn
                    size="custom"
                    borderless
                    className="h-10 w-10 text-2xl"
                    onClick={toggleMute}
                    onWheel={handleVolumeWheel}
                    ariaLabel={`${t('LabelVolume')}: ${volumePercent}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={volumePercent}
                  >
                    {getVolumeIcon(volume)}
                  </IconBtn>
                </div>
              </Tooltip>

              {/* Opens to the right, into the empty margin — the rail sits against the artwork,
                  so a popover opening upward lands on the cover */}
              <div className={railBtnClass}>
                <PlaybackRateWidget playerHandler={playerHandler} placement="right" />
              </div>

              <Tooltip text={sleepTimerLabel} position="left">
                <div className={railBtnClass}>
                  <SleepTimerWidget
                    controls={controls}
                    placement="right"
                    className={mergeClasses('h-10 w-10 text-2xl', sleepTimerSet ? 'text-warning' : '')}
                    ariaLabel={sleepTimerLabel}
                  >
                    <span className="material-symbols" aria-hidden="true">
                      snooze
                    </span>
                  </SleepTimerWidget>
                </div>
              </Tooltip>

              {!isPodcast && (
                <Tooltip text={t('LabelViewBookmarks')} position="left">
                  <div className={railBtnClass}>
                    <IconBtn
                      size="custom"
                      borderless
                      className={mergeClasses('h-10 w-10 text-2xl', isBookmarksPanelOpen ? 'text-accent' : '')}
                      onClick={handleBookmarksClick}
                      ariaLabel={t('LabelViewBookmarks')}
                      aria-pressed={settings.useLegacyBookmarksDialog ? undefined : isBookmarksPanelOpen}
                    >
                      {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
                    </IconBtn>
                  </div>
                </Tooltip>
              )}
            </div>
          </PlayerFullscreenArtwork>

          <PlayerFullscreenTitle streamLibraryItem={streamLibraryItem} metadata={metadata} onNavigate={onMinimize} />
        </div>

        {/* Docked rather than modal: at this width the artwork and the chapter list both fit,
            and covering the artwork to pick a chapter is the worse trade */}
        <div
          data-player-panel
          inert={!isChapterPanelOpen}
          className={mergeClasses(
            'h-full shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
            isChapterPanelOpen ? 'w-96 max-w-full opacity-100' : 'w-0 opacity-0'
          )}
        >
          <div className="h-full w-96 max-w-full p-3 ps-0">
            <PlayerFullscreenChapterPanel
              chapters={chapters}
              currentChapterId={currentChapter?.id ?? -1}
              playbackRate={playbackRate}
              isOpen={isChapterPanelOpen}
              amoled={settings.amoledPlayerSurfaces}
              onSeek={seek}
              onClose={closeChapterPanel}
            />
          </div>
        </div>
      </div>

      {/* Three columns rather than stacked rows: the side controls sit level with the transport
          controls instead of adding a row, which is what kept the bar a third taller than it
          needed to be. Settings sits on the left, chapters and queue on the right, so the two
          flanks stay balanced instead of piling everything on one side. */}
      <div className="player-fullscreen-pane relative z-10 shrink-0 bg-black px-6 pt-3 pb-5 lg:px-10 lg:pb-6">
        <div className="grid items-end gap-4 lg:grid-cols-[1fr_minmax(260px,560px)_1fr]">
          <div className="hidden items-center gap-2.5 pb-1 lg:flex">
            <Tooltip text={t('LabelViewPlayerSettings')} position="top">
              <IconBtn
                size="custom"
                borderless
                className="h-10 w-10 rounded-full text-2xl hover:bg-white/10"
                onClick={() => setIsSettingsModalOpen(true)}
                ariaLabel={t('LabelViewPlayerSettings')}
              >
                settings_slow_motion
              </IconBtn>
            </Tooltip>

            {/* Opt-in: some people want bookmarks as a permanent target rather than something
                that only appears when the artwork is hovered */}
            {!isPodcast && settings.showBookmarksInPlayerBar && (
              <Tooltip text={t('LabelViewBookmarks')} position="top">
                <IconBtn
                  size="custom"
                  borderless
                  className={mergeClasses('h-10 w-10 rounded-full text-2xl hover:bg-white/10', isBookmarksPanelOpen ? 'text-accent' : '')}
                  data-player-panel-toggle
                  onClick={handleBookmarksClick}
                  ariaLabel={t('LabelViewBookmarks')}
                  aria-pressed={settings.useLegacyBookmarksDialog ? undefined : isBookmarksPanelOpen}
                >
                  {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
                </IconBtn>
              </Tooltip>
            )}

            {/* Only while it is running — a countdown is a status, and hiding it when there is
                nothing to count keeps the flank quiet */}
            {sleepTimerSet && (
              <Tooltip text={`${t('LabelSleepTimer')}: ${sleepTimerRemainingString}`} position="top">
                {/* The widget, not the modal: a running countdown is exactly when you want to
                    nudge the timer, and dimming the whole player to add five minutes is the
                    wrong weight for that */}
                <SleepTimerWidget
                  controls={controls}
                  className="bg-warning/15 text-warning hover:bg-warning/25 flex h-8 items-center gap-1 rounded-full ps-2 pe-2.5"
                  ariaLabel={sleepTimerLabel}
                >
                  <span className="material-symbols text-lg" aria-hidden="true">
                    snooze
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums">{sleepTimerRemainingString}</span>
                </SleepTimerWidget>
              </Tooltip>
            )}
          </div>

          <div className="w-full min-w-0">
            <PlayerFullscreenTrackStack playerHandler={playerHandler} preferChapterScope={settings.showCoverProgressRing} />
            <PlayerTransportControls controls={controls} className="mt-1" />
          </div>

          <div className="flex items-center justify-center gap-2.5 pb-1 lg:justify-end">
            {/* Surfaces only once the rate is off 1x — the speed menu on the rail stays the
                primary control, this is the reminder that you left it somewhere */}
            <PlayerSpeedPill playerHandler={playerHandler} />

            {/* Opt-in mute toggle down here as well as on the rail — the readout beside the
                artwork is still the only slider, so this adds a target, not a second control */}
            {settings.showVolumeInPlayerBar && (
              <Tooltip text={volume === 0 ? t('LabelUnmute') : t('LabelMute')} position="top">
                <IconBtn
                  size="custom"
                  borderless
                  className="h-10 w-10 rounded-full text-2xl hover:bg-white/10"
                  onClick={toggleMute}
                  onWheel={handleVolumeWheel}
                  ariaLabel={`${t('LabelVolume')}: ${volumePercent}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={volumePercent}
                >
                  {getVolumeIcon(volume)}
                </IconBtn>
              </Tooltip>
            )}
            {chapters.length > 0 && (
              <Tooltip text={t('LabelViewChapters')} position="top">
                <IconBtn
                  size="custom"
                  borderless
                  className={mergeClasses('h-10 w-10 rounded-full text-2xl hover:bg-white/10', isChapterPanelOpen ? 'text-accent' : '')}
                  data-player-panel-toggle
                  onClick={() => {
                    setIsBookmarksPanelOpen(false)
                    setIsChapterPanelOpen((open) => !open)
                  }}
                  ariaLabel={t('LabelViewChapters')}
                  aria-pressed={isChapterPanelOpen}
                >
                  queue_music
                </IconBtn>
              </Tooltip>
            )}
            {settings.showQueueButton && playerQueueItems.length > 0 && (
              <Tooltip text={t('LabelViewQueue')} position="top">
                <IconBtn
                  size="custom"
                  borderless
                  className="h-10 w-10 rounded-full text-3xl hover:bg-white/10"
                  onClick={() => setIsQueueModalOpen(true)}
                  ariaLabel={t('LabelViewQueue')}
                >
                  playlist_play
                </IconBtn>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
