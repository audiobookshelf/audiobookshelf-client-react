'use client'

import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { usePlayerProgress } from '@/lib/player/playerProgressStore'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { PlayerState } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface PlayerTrackBarProps {
  playerHandler: PlayerHandler
  variant?: 'full' | 'mobile-collapsed'
  /**
   * What the bar spans. `auto` follows the user's "use chapter track" setting; the explicit
   * values let the fullscreen player stack a chapter bar and a whole-book bar at once.
   */
  scope?: 'auto' | 'chapter' | 'book'
  /** Suppresses the chapter title so stacked bars don't print it twice */
  hideChapterTitle?: boolean
  /** Overrides the slider's accessible name — stacked bars must not share one */
  ariaLabel?: string
  /**
   * Taller pill-shaped bar with rounded ends, for the fullscreen player. Ports the Vue
   * client's `rounded` variant, where the same bar carries the whole layout rather than
   * sitting in a dense strip.
   */
  rounded?: boolean
  /**
   * `stacked` puts the timestamps and chapter under the bar, which is what the mini player
   * has room for. `flanking` puts the chapter above and a timestamp at each end of the bar,
   * the way the Vue client's fullscreen player lays it out.
   */
  layout?: 'stacked' | 'flanking'
  className?: string
}

interface ChapterTick {
  title: string
  left: number
}

export default function PlayerTrackBar({
  playerHandler,
  variant = 'full',
  scope = 'auto',
  hideChapterTitle = false,
  ariaLabel,
  rounded = false,
  layout = 'stacked',
  className
}: PlayerTrackBarProps) {
  const t = useTypeSafeTranslations()
  const { duration, settings, chapters, playerState, transcodePercentReady, isHlsTranscode } = playerHandler.state
  const { seek } = playerHandler.controls
  const { playbackRate } = settings
  const { currentTime, bufferedTime } = usePlayerProgress()

  const currentChapter = useMemo(() => chapters.find((chapter) => chapter.start <= currentTime && chapter.end > currentTime) ?? null, [chapters, currentTime])

  // Falls back to whole-book whenever there is no chapter under the playhead — at the end of the
  // book, or in a gap between chapters. Without this the bar spans a zero-length range, and a tap
  // seeks to 0 and throws the listener back to the start.
  const requestedChapterScope = scope === 'auto' ? settings.useChapterTrack : scope === 'chapter'
  const useChapterTrack = requestedChapterScope && currentChapter !== null

  const isLoading = playerState === PlayerState.LOADING

  // Refs for DOM elements
  const trackRef = useRef<HTMLDivElement>(null)
  const hoverTimestampRef = useRef<HTMLDivElement>(null)
  const hoverTimestampTextRef = useRef<HTMLParagraphElement>(null)
  const hoverTimestampArrowRef = useRef<HTMLDivElement>(null)
  const trackCursorRef = useRef<HTMLDivElement>(null)

  // State
  const [trackWidth, setTrackWidth] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  // Chapter duration and start for chapter-mode display
  const currentChapterDuration = currentChapter ? currentChapter.end - currentChapter.start : 0
  const currentChapterStart = currentChapter ? currentChapter.start : 0

  // Effective playback rate
  const effectivePlaybackRate = playbackRate && !isNaN(playbackRate) ? playbackRate : 1

  // Time remaining timestamp
  const timeRemainingToShow = (useChapterTrack ? currentChapterDuration - (currentTime - currentChapterStart) : duration - currentTime) / effectivePlaybackRate
  // time remaining could be negative when the audio track is actually longer than the probed duration
  const timeRemainingFormatted = timeRemainingToShow < 0 ? secondsToTimestamp(timeRemainingToShow * -1) : `-${secondsToTimestamp(timeRemainingToShow)}`

  // Current time timestamp
  const currentTimeToShow = useChapterTrack ? Math.max(0, currentTime - currentChapterStart) : currentTime
  const currentTimeFormatted = secondsToTimestamp(currentTimeToShow / effectivePlaybackRate)
  const currentChapterNumber = currentChapter ? chapters.findIndex((ch) => ch.id === currentChapter.id) + 1 : null

  // Calculate track widths as percentages
  const effectiveDuration = useChapterTrack ? currentChapterDuration : duration
  const playedTime = useChapterTrack ? Math.max(0, currentTime - currentChapterStart) : currentTime
  const playedPercent = effectiveDuration ? Math.min(100, (playedTime / effectiveDuration) * 100) : 0

  const bufferedTimeAdjusted = useChapterTrack ? Math.max(0, bufferedTime - currentChapterStart) : bufferedTime
  const bufferedPercent = effectiveDuration ? Math.min(100, (bufferedTimeAdjusted / effectiveDuration) * 100) : 0
  const transcodeReadyPercent = isHlsTranscode ? Math.min(100, transcodePercentReady * 100) : 0

  // Chapter ticks for display (only visible when not in chapter mode)
  const chapterTicks = useMemo<ChapterTick[]>(() => {
    if (!duration || trackWidth === 0) return []
    return chapters.map((chapter) => {
      const perc = chapter.start / duration
      return {
        title: chapter.title,
        left: perc * trackWidth
      }
    })
  }, [chapters, duration, trackWidth])

  // Only the chapter tick positions still need this; pointer maths reads the live rect
  const measureTrack = useCallback(() => {
    if (trackRef.current) setTrackWidth(trackRef.current.clientWidth)
  }, [])

  useEffect(() => {
    measureTrack()
    window.addEventListener('resize', measureTrack)
    return () => window.removeEventListener('resize', measureTrack)
  }, [measureTrack])

  // Re-measure when player state changes (track might become visible)
  useEffect(() => {
    measureTrack()
  }, [playerState, measureTrack])

  const baseTime = useChapterTrack ? currentChapterStart : 0
  const scopeDuration = useChapterTrack ? currentChapterDuration : duration

  /** Fraction of the bar under the pointer, clamped so an overshoot cannot seek out of range */
  const fractionAtClientX = useCallback((clientX: number): number | null => {
    const rect = trackRef.current?.getBoundingClientRect()
    // rect.width rather than the measured state: the state only refreshes on window resize,
    // and the bar can be resized by layout changes that never fire one
    if (!rect || !rect.width) return null
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }, [])

  const seekToFraction = useCallback(
    (fraction: number) => {
      if (isLoading || !scopeDuration) return

      const time = baseTime + fraction * scopeDuration
      if (!Number.isFinite(time)) return

      seek(time)
    },
    [isLoading, baseTime, scopeDuration, seek]
  )

  const isScrubbingRef = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return

      const fraction = fractionAtClientX(e.clientX)
      if (fraction === null) return

      isScrubbingRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      seekToFraction(fraction)
    },
    [fractionAtClientX, seekToFraction]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isScrubbingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    // Touch never fires pointerleave, so the readout would stay pinned over the bar forever
    if (e.pointerType !== 'mouse') setIsHovering(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!scopeDuration) return

      const step = e.key === 'PageUp' || e.key === 'PageDown' ? 60 : 10
      let time: number | null = null

      if (e.key === 'ArrowRight' || e.key === 'PageUp') time = currentTime + step
      else if (e.key === 'ArrowLeft' || e.key === 'PageDown') time = currentTime - step
      else if (e.key === 'Home') time = baseTime
      else if (e.key === 'End') time = baseTime + scopeDuration

      if (time === null) return
      e.preventDefault()
      e.stopPropagation()
      seek(Math.min(baseTime + scopeDuration, Math.max(baseTime, time)))
    },
    [baseTime, scopeDuration, currentTime, seek]
  )

  // Positions the hover readout. Pointer-based so a drag keeps updating it, but only a fine
  // pointer reveals it — on touch the finger is covering the bar anyway.
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || !rect.width) return

      if (isScrubbingRef.current) {
        const fraction = fractionAtClientX(e.clientX)
        if (fraction !== null) seekToFraction(fraction)
      }

      if (e.pointerType !== 'mouse') return

      const trackWidth = rect.width
      const offsetX = Math.min(trackWidth, Math.max(0, e.clientX - rect.left))

      const progressTime = (offsetX / trackWidth) * scopeDuration
      const totalTime = baseTime + progressTime

      // Position hover timestamp
      if (hoverTimestampRef.current) {
        const width = hoverTimestampRef.current.clientWidth
        let posLeft = offsetX - width / 2

        // Keep within bounds. Measured from the live rect, so it stays correct when the bar
        // moves for a reason that never fired a window resize.
        if (posLeft + width + rect.left > window.innerWidth) {
          posLeft = window.innerWidth - width - rect.left
        } else if (posLeft < -rect.left) {
          posLeft = -rect.left
        }

        hoverTimestampRef.current.style.left = `${posLeft}px`
      }

      // Position arrow
      if (hoverTimestampArrowRef.current) {
        const arrowWidth = hoverTimestampArrowRef.current.clientWidth
        hoverTimestampArrowRef.current.style.left = `${offsetX - arrowWidth / 2}px`
      }

      // Update hover text
      if (hoverTimestampTextRef.current) {
        let hoverText = secondsToTimestamp(progressTime / effectivePlaybackRate)

        // Find chapter at hover position and add title
        const chapter = chapters.find((ch) => ch.start <= totalTime && totalTime < ch.end)
        if (chapter?.title) {
          hoverText += ` - ${chapter.title}`
        }

        hoverTimestampTextRef.current.innerText = hoverText
      }

      // Position track cursor
      if (trackCursorRef.current) {
        trackCursorRef.current.style.left = `${offsetX - 1}px`
      }

      setIsHovering(true)
    },
    [fractionAtClientX, seekToFraction, baseTime, scopeDuration, effectivePlaybackRate, chapters]
  )

  const handlePointerLeave = useCallback(() => {
    if (!isScrubbingRef.current) setIsHovering(false)
  }, [])

  const isMobileCollapsed = variant === 'mobile-collapsed'

  const barBlock = (
    <div className="relative">
      {/* The padding widens the touch target without changing layout height, which the
            negative margin cancels. The visual bar stays 8px. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel ?? t('LabelPlaybackPosition')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(playedPercent)}
        aria-valuetext={`${currentTimeFormatted} / ${timeRemainingFormatted}`}
        className="group/track relative -my-2.5 w-full cursor-pointer touch-none py-2.5"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={trackRef}
          className={mergeClasses(
            'bg-track-bg relative w-full transition-transform duration-100 group-hover/track:scale-y-125',
            // The rounded variant still clips, or the square-ended fills would poke out of
            // the pill at both ends
            rounded ? 'h-2.5 overflow-hidden rounded-full' : 'h-2 overflow-hidden'
          )}
        >
          {/* HLS transcode ready track (server-side segment progress) */}
          {isHlsTranscode && (
            <div
              className="bg-track-progress/30 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
              style={{ width: `${transcodeReadyPercent}%` }}
            />
          )}
          {/* Buffer track */}
          <div
            className="bg-track-progress/50 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Played track */}
          <div
            className={mergeClasses(
              'bg-track-progress pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75',
              rounded ? 'rounded-full' : ''
            )}
            style={{ width: `${playedPercent}%` }}
          />
          {/* Track cursor (vertical line on hover) */}
          <div
            ref={trackCursorRef}
            className={mergeClasses(
              'bg-track-progress pointer-events-none absolute top-0 left-0 h-full w-0.5 transition-opacity duration-100',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          />
          {/* Loading animation - sliding shimmer effect */}
          {isLoading && (
            <div className="via-track-progress/30 loading-track-slide pointer-events-none absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent to-transparent" />
          )}
        </div>
      </div>

      {/* Chapter ticks */}
      <div className={mergeClasses('relative h-2 w-full overflow-hidden', useChapterTrack ? 'opacity-0' : '')}>
        {chapterTicks.map((tick, index) => (
          <div key={index} className="bg-track-progress/30 pointer-events-none absolute top-0 h-1 w-px" style={{ left: `${tick.left}px` }} />
        ))}
      </div>

      {/* Hover timestamp */}
      <div
        ref={hoverTimestampRef}
        className={mergeClasses(
          'bg-foreground text-background pointer-events-none absolute -top-8 left-0 z-10 rounded-full transition-opacity duration-100',
          isHovering ? 'opacity-100' : 'opacity-0'
        )}
      >
        <p ref={hoverTimestampTextRef} className="truncate px-2 py-0.5 text-center font-mono text-xs whitespace-nowrap">
          00:00
        </p>
      </div>

      {/* Hover timestamp arrow */}
      <div
        ref={hoverTimestampArrowRef}
        className={mergeClasses(
          'bg-foreground text-background pointer-events-none absolute -top-3.5 left-0 rounded-full transition-opacity duration-100',
          isHovering ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="absolute right-0 -bottom-1.5 left-0 flex w-full justify-center">
          <div className="border-t-foreground h-0 w-0 border-t-4 border-r-4 border-l-4 border-r-transparent border-l-transparent" />
        </div>
      </div>
    </div>
  )

  // Fullscreen: chapter above the bar, the two timestamps flanking it. The timestamps read
  // as the ends of the bar this way instead of as a caption under it, and the chapter gets
  // the full width rather than whatever is left between two strings of unequal length.
  if (layout === 'flanking') {
    return (
      <div className={className}>
        {!hideChapterTitle && (
          <div className="mb-2 flex items-center justify-center gap-2">
            {/* A plain truncating span, not TruncatingTooltipText: that wrapper is `w-full`, which
                as a flex item eats the whole row and pushes the percentage out to the edge
                instead of letting the pair sit centred together */}
            {currentChapter ? (
              <span dir="auto" className="text-foreground-muted min-w-0 truncate text-sm">
                {currentChapter.title}
              </span>
            ) : (
              <span className="text-foreground-subdued text-sm">{t('LabelChapter')}</span>
            )}
            <span className="text-foreground-subdued shrink-0 font-mono text-xs">· {Math.round(playedPercent)}%</span>
          </div>
        )}

        {/* -mt-1 offsets the chapter tick strip the bar renders below itself, so the
            timestamps sit level with the bar rather than with the whole block */}
        <div className="flex items-center gap-2.5">
          <p className="text-foreground-muted -mt-1 w-24 shrink-0 text-end font-mono text-base leading-none">{currentTimeFormatted}</p>
          <div className="min-w-0 grow">{barBlock}</div>
          <p className="text-foreground-muted -mt-1 w-24 shrink-0 font-mono text-base leading-none">{timeRemainingFormatted}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {barBlock}
      {/* Both timestamps get the same fixed width, so the chapter title between them is centred
          on the bar rather than on whatever is left after two strings of different lengths */}
      <div className={mergeClasses('flex items-center gap-3', isMobileCollapsed ? 'mt-0.5' : '')}>
        <p className={mergeClasses('text-foreground-muted w-24 shrink-0 text-start font-mono', isMobileCollapsed ? 'text-xs' : 'text-sm')}>
          {currentTimeFormatted}
          {' / '}
          {Math.round(playedPercent)}%
        </p>
        {currentChapter && !hideChapterTitle ? (
          <div className="text-foreground-muted flex min-w-0 flex-1 items-center justify-center">
            <TruncatingTooltipText
              lazy
              text={currentChapter.title}
              className={mergeClasses('min-w-0', isMobileCollapsed ? 'text-xs' : 'text-sm')}
              position="top"
            />
            {useChapterTrack && currentChapterNumber !== null && (
              <span className="text-foreground-subdued shrink-0 pl-1 text-xs">
                ({currentChapterNumber} of {chapters.length})
              </span>
            )}
          </div>
        ) : (
          <span className="flex-1" />
        )}
        <p className={mergeClasses('text-foreground-muted w-24 shrink-0 text-end font-mono', isMobileCollapsed ? 'text-xs' : 'text-sm')}>
          {timeRemainingFormatted}
        </p>
      </div>
    </div>
  )
}
