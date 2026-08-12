'use client'

import { isAbsModalOpen } from '@/components/modals/Modal'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { secondsToTimestamp } from '@/lib/datefns'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { MAX_PLAYBACK_RATE, MIN_PLAYBACK_RATE } from '@/lib/player/constants'
import { subscribePlayerJump, type PlayerJumpDirection } from '@/lib/player/playerFeedbackStore'
import { usePlayerProgress } from '@/lib/player/playerProgressStore'
import type { Chapter } from '@/types/api'
import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PreviewCover from '../covers/PreviewCover'
import PlaybackRateWidget from './PlaybackRateWidget'
import PlayerCoverProgressRing from './PlayerCoverProgressRing'
import PlayerFullscreenChapterPanel from './PlayerFullscreenChapterPanel'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'
import PlayerTrackBar from './PlayerTrackBar'
import PlayerTransportControls from './PlayerTransportControls'
import type { PlayerControlsState } from './usePlayerControlsState'
import VolumeControl from './VolumeControl'

interface PlayerFullscreenProps {
  controls: PlayerControlsState
  metadata: PlayerMetadataDisplay
  onMinimize: () => void
}

interface JumpBurst {
  direction: PlayerJumpDirection
  amount: number
  /** Remounts the burst so the animation replays on rapid presses */
  key: number
}

/** Matches the artwork's rounded-2xl, so the progress ring stays concentric */
const COVER_RADIUS = 16
const MAX_COVER_WIDTH = 420
const MIN_COVER_WIDTH = 120
/** Room beside the artwork for the hover controls */
const COVER_SIDE_RESERVE = 130
/** Room under the artwork for the title, authors and timestamps */
const COVER_BELOW_RESERVE = 132

const JUMP_BURST_MS = 600
const VOLUME_HUD_MS = 1400
const RATE_PULSE_MS = 260

function getVolumeIcon(volume: number): string {
  if (volume === 0) return 'volume_off'
  if (volume < 0.5) return 'volume_down'
  return 'volume_up'
}

/**
 * Immersive fullscreen player. Opened from the expand button on the mini player and
 * closed with the same button, Escape, or the arrow in the top corner.
 *
 * Rendered inside a `theme-dark` scope so shared player components (track bar, transport
 * controls, icon buttons) resolve their tokens against the dark palette the artwork
 * backdrop needs, whichever theme the rest of the app is using.
 */
export default function PlayerFullscreen({ controls, metadata, onMinimize }: PlayerFullscreenProps) {
  const { playerHandler, streamLibraryItem, chapters, bookmarks, isPodcast, seek, openBookmarksModal, setIsSleepTimerModalOpen, sleepTimer, t } = controls

  const { duration, currentChapter, settings, volume } = playerHandler.state
  const { setPlaybackRate, incrementPlaybackRate, decrementPlaybackRate } = playerHandler.controls
  const { currentTime } = usePlayerProgress()
  const coverAspectRatio = useBookCoverAspectRatio()

  const playbackRate = settings.playbackRate && !Number.isNaN(settings.playbackRate) ? settings.playbackRate : 1

  const [isChapterPanelOpen, setIsChapterPanelOpen] = useState(false)
  const [scrubPercent, setScrubPercent] = useState<number | null>(null)

  // ============================================================================
  // Artwork sizing
  // ============================================================================

  const stageRef = useRef<HTMLDivElement>(null)
  const [coverWidth, setCoverWidth] = useState(MIN_COVER_WIDTH)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const measure = () => {
      const widthLimit = stage.clientWidth - COVER_SIDE_RESERVE
      const heightLimit = (stage.clientHeight - COVER_BELOW_RESERVE) / coverAspectRatio
      setCoverWidth(Math.max(MIN_COVER_WIDTH, Math.min(MAX_COVER_WIDTH, widthLimit, heightLimit)))
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(stage)
    return () => resizeObserver.disconnect()
  }, [coverAspectRatio])

  const coverHeight = coverWidth * coverAspectRatio

  // ============================================================================
  // Progress
  // ============================================================================

  const progressPercent = duration ? Math.min(100, (100 * currentTime) / duration) : 0
  const displayTime = scrubPercent !== null ? (scrubPercent / 100) * duration : currentTime

  const chapterProgressPercent = useMemo(() => {
    if (!currentChapter) return 0
    const chapterDuration = currentChapter.end - currentChapter.start
    if (!chapterDuration) return 0
    return Math.min(100, Math.round((100 * Math.max(0, currentTime - currentChapter.start)) / chapterDuration))
  }, [currentChapter, currentTime])

  const handleScrubCommit = useCallback(
    (percent: number) => {
      if (!duration) return
      seek((percent / 100) * duration)
    },
    [duration, seek]
  )

  const handleSelectChapter = useCallback(
    (chapter: Chapter) => {
      seek(chapter.start)
      setIsChapterPanelOpen(false)
    },
    [seek]
  )

  // ============================================================================
  // Transient feedback
  // ============================================================================

  const [jumpBurst, setJumpBurst] = useState<JumpBurst | null>(null)
  const jumpBurstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = subscribePlayerJump(({ direction, amount }) => {
      setJumpBurst((previous) => ({ direction, amount, key: (previous?.key ?? 0) + 1 }))

      if (jumpBurstTimeoutRef.current) clearTimeout(jumpBurstTimeoutRef.current)
      jumpBurstTimeoutRef.current = setTimeout(() => setJumpBurst(null), JUMP_BURST_MS)
    })

    return () => {
      unsubscribe()
      if (jumpBurstTimeoutRef.current) clearTimeout(jumpBurstTimeoutRef.current)
    }
  }, [])

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

  const [isRatePulsing, setIsRatePulsing] = useState(false)
  const previousRateRef = useRef(playbackRate)
  const ratePulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const previousRate = previousRateRef.current
    previousRateRef.current = playbackRate
    if (previousRate === playbackRate) return
    // While the pill is appearing or leaving, its own transition is the feedback.
    // Pulsing on top of that would fight it for the transform property.
    if (previousRate === 1 || playbackRate === 1) return

    setIsRatePulsing(true)
    if (ratePulseTimeoutRef.current) clearTimeout(ratePulseTimeoutRef.current)
    ratePulseTimeoutRef.current = setTimeout(() => setIsRatePulsing(false), RATE_PULSE_MS)
  }, [playbackRate])

  useEffect(() => {
    return () => {
      if (volumeHudTimeoutRef.current) clearTimeout(volumeHudTimeoutRef.current)
      if (ratePulseTimeoutRef.current) clearTimeout(ratePulseTimeoutRef.current)
    }
  }, [])

  // ============================================================================
  // Shell behaviour
  // ============================================================================

  // Escape closes the chapter panel first. Anything else falls through to the global
  // player hotkeys, which exit fullscreen.
  useEffect(() => {
    if (!isChapterPanelOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isAbsModalOpen()) return
      e.preventDefault()
      e.stopPropagation()
      setIsChapterPanelOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isChapterPanelOpen])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // ============================================================================
  // Playback rate pill
  // ============================================================================

  const rateStep = settings.playbackRateIncrementDecrement
  const isPlaybackRateModified = playbackRate !== 1
  const canIncrementRate = playbackRate + rateStep <= MAX_PLAYBACK_RATE
  const canDecrementRate = playbackRate - rateStep >= MIN_PLAYBACK_RATE
  // Mirrors PlaybackRateWidget's formatting so the pill and the menu never disagree
  const playbackRateLabel = rateStep === 0.05 ? playbackRate.toFixed(2) : playbackRate.toFixed(1)

  const { sleepTimerSet, remainingString: sleepTimerRemainingString } = sleepTimer
  const coverSrc = getLibraryItemCoverSrc(streamLibraryItem, getPlaceholderCoverUrl())
  const volumePercent = Math.round(volume * 100)
  const durationLabel = secondsToTimestamp(duration / playbackRate)

  return (
    <div
      className="theme-dark bg-primary text-foreground fixed inset-0 z-60 flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t('LabelPlayerFullscreen')}
    >
      {/* Blurred artwork backdrop */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 scale-110 bg-cover bg-center blur-3xl brightness-50" style={{ backgroundImage: `url(${coverSrc})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" />
      </div>

      <div className="player-fullscreen-corner absolute start-0 top-0 z-20 h-28 w-40 ps-5 pt-4">
        <IconBtn
          size="custom"
          borderless
          className="player-fullscreen-corner-btn h-10 w-10 rounded-full bg-white/5 text-2xl hover:bg-white/15"
          onClick={onMinimize}
          ariaLabel={t('LabelExitFullscreenPlayer')}
        >
          keyboard_arrow_down
        </IconBtn>
      </div>

      {/* No overflow-hidden here: it would clip the volume and speed popovers */}
      <div className="relative z-10 flex min-h-0 grow">
        <div ref={stageRef} className="flex min-h-0 min-w-0 grow flex-col items-center justify-center px-6 pt-14 pb-2">
          <div className="group relative shrink-0" style={{ width: coverWidth, height: coverHeight }}>
            <PlayerCoverProgressRing
              coverWidth={coverWidth}
              coverHeight={coverHeight}
              coverRadius={COVER_RADIUS}
              progressPercent={progressPercent}
              disabled={!duration}
              onScrubChange={setScrubPercent}
              onScrubCommit={handleScrubCommit}
            />

            <div className="h-full w-full overflow-hidden rounded-2xl shadow-2xl">
              <PreviewCover src={coverSrc} width={coverWidth} bookCoverAspectRatio={coverAspectRatio} showResolution={false} />
            </div>

            <div
              className={mergeClasses(
                'pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 transition-opacity duration-200',
                scrubPercent !== null ? 'opacity-100' : 'opacity-0'
              )}
            >
              <p className="font-mono text-sm">
                {secondsToTimestamp(displayTime / playbackRate)} / {durationLabel}
              </p>
            </div>

            {/* Jump feedback — the only visible confirmation when the jump came from a hotkey */}
            {jumpBurst && (
              <div
                key={jumpBurst.key}
                aria-hidden="true"
                className={mergeClasses(
                  'player-jump-burst pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl',
                  jumpBurst.direction === 'backward' ? 'player-jump-burst-back' : 'player-jump-burst-fwd'
                )}
              >
                <div className="player-jump-burst-pill flex h-24 w-24 flex-col items-center justify-center gap-0.5 rounded-full bg-black/55 ring-1 ring-white/15 backdrop-blur-md">
                  <span className="player-jump-burst-icon material-symbols text-3xl leading-none">
                    {jumpBurst.direction === 'backward' ? 'replay' : 'forward_media'}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {jumpBurst.direction === 'backward' ? '−' : '+'}
                    {jumpBurst.amount}s
                  </span>
                </div>
              </div>
            )}

            {/* Volume readout, mirrored opposite the hover controls */}
            {isVolumeHudVisible && (
              <div aria-hidden="true" className="player-volume-hud pointer-events-none absolute end-full top-1/2 z-30 -translate-y-1/2 pe-5">
                <div className="flex w-11 flex-col items-center gap-2 rounded-full bg-black/55 py-3 ring-1 ring-white/15 backdrop-blur-md">
                  <span className="material-symbols text-xl leading-none">{getVolumeIcon(volume)}</span>
                  <div className="relative h-28 w-1.5 overflow-hidden rounded-full bg-white/20">
                    <div className="player-volume-hud-fill absolute bottom-0 left-0 w-full rounded-full bg-white" style={{ height: `${volumePercent}%` }} />
                  </div>
                  <span className="font-mono text-[11px] font-semibold tabular-nums">{volumePercent}</span>
                </div>
              </div>
            )}

            {/* ps-5 rather than ms-5 so the gap beside the artwork is part of the hover target */}
            <div className="player-fab-stack pointer-events-none absolute start-full top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 ps-5 group-focus-within:pointer-events-auto group-hover:pointer-events-auto">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/15">
                <VolumeControl playerHandler={playerHandler} />
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/15">
                <PlaybackRateWidget playerHandler={playerHandler} />
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/15">
                <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={() => setIsSleepTimerModalOpen(true)} ariaLabel={t('LabelSleepTimer')}>
                  snooze
                </IconBtn>
              </div>

              {!isPodcast && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/15">
                  <IconBtn size="custom" borderless className="w-10 text-2xl" onClick={openBookmarksModal} ariaLabel={t('LabelViewBookmarks')}>
                    {bookmarks.length ? 'bookmarks' : 'bookmark_border'}
                  </IconBtn>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 w-full max-w-xl shrink-0 text-center">
            <Link
              href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`}
              className="block truncate text-xl font-bold hover:underline sm:text-2xl"
            >
              {metadata.displayTitle}
            </Link>
            {metadata.podcastAuthor ? (
              <p className="text-foreground-muted mt-1 truncate text-base">{metadata.podcastAuthor}</p>
            ) : metadata.bookAuthors.length > 0 ? (
              <p className="text-foreground-muted mt-1 truncate text-base">
                {metadata.bookAuthors.map((author, index) => (
                  <span key={author.id}>
                    <Link href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`} className="hover:underline">
                      {author.name}
                    </Link>
                    {index < metadata.bookAuthors.length - 1 && <span>, </span>}
                  </span>
                ))}
              </p>
            ) : null}
            <p className="text-foreground-muted mt-2 font-mono text-lg">
              {secondsToTimestamp(displayTime / playbackRate)} <span className="text-foreground-subdued">/</span> {durationLabel}
            </p>
          </div>
        </div>

        <div
          inert={!isChapterPanelOpen}
          className={mergeClasses(
            'h-full shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out',
            isChapterPanelOpen ? 'w-96 max-w-full opacity-100' : 'w-0 opacity-0'
          )}
        >
          <div className="h-full w-96 max-w-full p-3 ps-0">
            <PlayerFullscreenChapterPanel
              chapters={chapters}
              currentChapterId={currentChapter?.id ?? null}
              playbackRate={playbackRate}
              onSelect={handleSelectChapter}
              onClose={() => setIsChapterPanelOpen(false)}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 shrink-0 bg-black px-6 pt-3 pb-5 lg:px-10 lg:pb-6">
        <div className="grid items-end gap-4 lg:grid-cols-[1fr_minmax(260px,560px)_1fr]">
          <div className="hidden lg:block" />

          <div className="w-full min-w-0">
            <div className="mb-2 flex items-center justify-center gap-2">
              {currentChapter ? (
                <p className="text-foreground-muted truncate text-sm">{currentChapter.title}</p>
              ) : (
                <p className="text-foreground-subdued text-sm">{t('LabelChapters')}</p>
              )}
              <span className="text-foreground-subdued shrink-0 font-mono text-xs">· {chapterProgressPercent}%</span>
            </div>

            <PlayerTrackBar playerHandler={playerHandler} />
            <PlayerTransportControls controls={controls} className="mt-1" />
          </div>

          <div className="flex items-center justify-center gap-2.5 lg:justify-self-end lg:pe-1">
            {/* Only surfaces once the rate is off 1x — the speed menu on the artwork stays the primary control */}
            {isPlaybackRateModified && (
              <div
                className={mergeClasses(
                  'player-speed-pill bg-accent/15 text-accent flex h-8 items-center rounded-full px-0.5',
                  isRatePulsing ? 'player-speed-pill-pulse' : ''
                )}
              >
                <Tooltip text={t('ButtonSlower')} position="top">
                  <IconBtn
                    size="custom"
                    borderless
                    disabled={!canDecrementRate}
                    className="hover:bg-accent/25 h-7 w-7 rounded-full text-base"
                    onClick={decrementPlaybackRate}
                    ariaLabel={t('ButtonSlower')}
                  >
                    remove
                  </IconBtn>
                </Tooltip>

                <Tooltip text={t('ButtonResetToDefault')} position="top">
                  <button
                    type="button"
                    className="hover:bg-accent/25 h-7 cursor-pointer rounded-full px-1.5 font-mono text-xs font-semibold tabular-nums"
                    onClick={() => setPlaybackRate(1)}
                    aria-label={t('ButtonResetToDefault')}
                  >
                    {playbackRateLabel}x
                  </button>
                </Tooltip>

                <Tooltip text={t('ButtonFaster')} position="top">
                  <IconBtn
                    size="custom"
                    borderless
                    disabled={!canIncrementRate}
                    className="hover:bg-accent/25 h-7 w-7 rounded-full text-base"
                    onClick={incrementPlaybackRate}
                    ariaLabel={t('ButtonFaster')}
                  >
                    add
                  </IconBtn>
                </Tooltip>
              </div>
            )}

            {sleepTimerSet && (
              <button
                type="button"
                className="bg-warning/15 text-warning hover:bg-warning/25 flex h-8 cursor-pointer items-center gap-1 rounded-full ps-2 pe-2.5"
                onClick={() => setIsSleepTimerModalOpen(true)}
                aria-label={t('LabelSleepTimer')}
              >
                <span className="material-symbols text-lg" aria-hidden="true">
                  snooze
                </span>
                <span className="font-mono text-xs font-semibold">{sleepTimerRemainingString}</span>
              </button>
            )}

            {chapters.length > 0 && (
              <IconBtn
                size="custom"
                borderless
                className={mergeClasses('mx-1 h-10 w-10 rounded-full text-2xl hover:bg-white/10', isChapterPanelOpen ? 'text-accent' : '')}
                onClick={() => setIsChapterPanelOpen((open) => !open)}
                ariaLabel={t('LabelViewChapters')}
                aria-pressed={isChapterPanelOpen}
              >
                queue_music
              </IconBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
