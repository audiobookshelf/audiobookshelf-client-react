'use client'

import PlayerMarqueeText from '@/components/player/PlayerMarqueeText'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { PLAYER_SWIPE_LOCK_PX, shouldLockPlayerShellHorizontalSeek, shouldLockPlayerShellSwipe } from '@/lib/player/playerShellSwipe'
import { usePlayerProgress } from '@/lib/player/playerProgressStore'
import { PlayerState } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface PlayerTrackBarProps {
  playerHandler: PlayerHandler
  scope?: 'auto' | 'book' | 'chapter'
  /** Fullscreen mobile: chapter title above the slider for a wider marquee. */
  chapterLabelPlacement?: 'below' | 'above'
  /** Mini player: wait for horizontal movement before seeking so vertical shell swipes win. */
  deferTouchSeekToShellGestures?: boolean
}

interface ChapterTick {
  title: string
  left: number
}

export default function PlayerTrackBar({
  playerHandler,
  scope = 'auto',
  chapterLabelPlacement = 'below',
  deferTouchSeekToShellGestures = false
}: PlayerTrackBarProps) {
  const t = useTypeSafeTranslations()
  const { duration, settings, chapters, playerState, transcodePercentReady, isHlsTranscode } = playerHandler.state
  const { seek } = playerHandler.controls
  const { playbackRate, useChapterTrack } = settings
  const { currentTime, bufferedTime } = usePlayerProgress()

  const currentChapter = useMemo(() => chapters.find((chapter) => chapter.start <= currentTime && chapter.end > currentTime) ?? null, [chapters, currentTime])

  const isLoading = playerState === PlayerState.LOADING

  const trackRef = useRef<HTMLDivElement>(null)
  const hoverTimestampRef = useRef<HTMLDivElement>(null)
  const hoverTimestampTextRef = useRef<HTMLParagraphElement>(null)
  const hoverTimestampArrowRef = useRef<HTMLDivElement>(null)
  const trackCursorRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const touchGestureRef = useRef<{ pending: boolean; aborted: boolean; startX: number; startY: number } | null>(null)

  const [trackWidth, setTrackWidth] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const currentChapterDuration = currentChapter ? currentChapter.end - currentChapter.start : 0
  const currentChapterStart = currentChapter ? currentChapter.start : 0
  const preferChapterScope = scope === 'chapter' || (scope === 'auto' && useChapterTrack)
  const inChapterScope = preferChapterScope && currentChapterDuration > 0

  const effectivePlaybackRate = playbackRate && !isNaN(playbackRate) ? playbackRate : 1

  const timeRemainingToShow = (inChapterScope ? currentChapterDuration - (currentTime - currentChapterStart) : duration - currentTime) / effectivePlaybackRate
  const timeRemainingFormatted = timeRemainingToShow < 0 ? secondsToTimestamp(timeRemainingToShow * -1) : `-${secondsToTimestamp(timeRemainingToShow)}`

  const currentTimeToShow = inChapterScope ? Math.max(0, currentTime - currentChapterStart) : currentTime
  const currentTimeFormatted = secondsToTimestamp(currentTimeToShow / effectivePlaybackRate)
  const currentChapterNumber = currentChapter ? chapters.findIndex((ch) => ch.id === currentChapter.id) + 1 : null

  const effectiveDuration = inChapterScope ? currentChapterDuration : duration
  const playedTime = inChapterScope ? Math.max(0, currentTime - currentChapterStart) : currentTime
  const playedPercent = effectiveDuration ? Math.min(100, (playedTime / effectiveDuration) * 100) : 0

  const bufferedTimeAdjusted = inChapterScope ? Math.max(0, bufferedTime - currentChapterStart) : bufferedTime
  const bufferedPercent = effectiveDuration ? Math.min(100, (bufferedTimeAdjusted / effectiveDuration) * 100) : 0
  const transcodeReadyPercent = isHlsTranscode ? Math.min(100, transcodePercentReady * 100) : 0

  const chapterTicks = useMemo<ChapterTick[]>(() => {
    if (!duration || trackWidth === 0 || inChapterScope) return []
    return chapters.map((chapter) => {
      const perc = chapter.start / duration
      return {
        title: chapter.title,
        left: perc * trackWidth
      }
    })
  }, [chapters, duration, inChapterScope, trackWidth])

  const sliderLabel = inChapterScope ? t('AriaLabelChapterProgress') : t('AriaLabelBookProgress')

  const measureTrack = useCallback(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.clientWidth)
    }
  }, [])

  useEffect(() => {
    measureTrack()
    const el = trackRef.current
    if (!el) return
    const resizeObserver = new ResizeObserver(() => measureTrack())
    resizeObserver.observe(el)
    window.addEventListener('resize', measureTrack)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureTrack)
    }
  }, [measureTrack])

  useEffect(() => {
    measureTrack()
  }, [playerState, measureTrack])

  const updateHoverUi = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || rect.width <= 0) return

      const offsetX = Math.min(rect.width, Math.max(0, clientX - rect.left))
      const perc = offsetX / rect.width
      const baseTime = inChapterScope ? currentChapterStart : 0
      const dur = inChapterScope ? currentChapterDuration : duration
      const progressTime = perc * dur
      const totalTime = baseTime + progressTime

      if (hoverTimestampRef.current) {
        const width = hoverTimestampRef.current.clientWidth
        let posLeft = offsetX - width / 2
        const trackOffsetLeft = rect.left
        if (posLeft + width + trackOffsetLeft > window.innerWidth) {
          posLeft = window.innerWidth - width - trackOffsetLeft
        } else if (posLeft < -trackOffsetLeft) {
          posLeft = -trackOffsetLeft
        }
        hoverTimestampRef.current.style.left = `${posLeft}px`
      }

      if (hoverTimestampArrowRef.current) {
        const arrowWidth = hoverTimestampArrowRef.current.clientWidth
        hoverTimestampArrowRef.current.style.left = `${offsetX - arrowWidth / 2}px`
      }

      if (hoverTimestampTextRef.current) {
        let hoverText = secondsToTimestamp(progressTime / effectivePlaybackRate)
        const chapter = chapters.find((ch) => ch.start <= totalTime && totalTime < ch.end)
        if (chapter?.title) {
          hoverText += ` - ${chapter.title}`
        }
        hoverTimestampTextRef.current.innerText = hoverText
      }

      if (trackCursorRef.current) {
        trackCursorRef.current.style.left = `${offsetX - 1}px`
      }

      setIsHovering(true)
    },
    [chapters, currentChapterDuration, currentChapterStart, duration, effectivePlaybackRate, inChapterScope]
  )

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (isLoading) return
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || rect.width <= 0) return

      const perc = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const baseTime = inChapterScope ? currentChapterStart : 0
      const dur = inChapterScope ? currentChapterDuration : duration
      if (dur <= 0) return

      const time = baseTime + perc * dur
      if (isNaN(time)) return
      seek(time)
    },
    [currentChapterDuration, currentChapterStart, duration, inChapterScope, isLoading, seek]
  )

  const clearTouchGesture = useCallback(() => {
    touchGestureRef.current = null
  }, [])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return

      if (event.pointerType === 'touch' && deferTouchSeekToShellGestures) {
        touchGestureRef.current = {
          pending: true,
          aborted: false,
          startX: event.clientX,
          startY: event.clientY
        }
        return
      }

      event.preventDefault()
      draggingRef.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      seekFromClientX(event.clientX)
      updateHoverUi(event.clientX)
    },
    [deferTouchSeekToShellGestures, seekFromClientX, updateHoverUi]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const touchGesture = touchGestureRef.current
      if (event.pointerType === 'touch' && deferTouchSeekToShellGestures && touchGesture?.pending && !touchGesture.aborted) {
        const dx = event.clientX - touchGesture.startX
        const dy = event.clientY - touchGesture.startY

        if (shouldLockPlayerShellSwipe(dx, dy)) {
          touchGesture.aborted = true
          touchGesture.pending = false
          return
        }

        if (shouldLockPlayerShellHorizontalSeek(dx, dy)) {
          touchGesture.pending = false
          event.preventDefault()
          draggingRef.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          seekFromClientX(event.clientX)
          updateHoverUi(event.clientX)
        }
        return
      }

      if (event.pointerType === 'mouse' || draggingRef.current) {
        updateHoverUi(event.clientX)
      }
      if (draggingRef.current) {
        seekFromClientX(event.clientX)
      }
    },
    [deferTouchSeekToShellGestures, seekFromClientX, updateHoverUi]
  )

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const touchGesture = touchGestureRef.current
      if (touchGesture?.pending && !touchGesture.aborted) {
        const dx = event.clientX - touchGesture.startX
        const dy = event.clientY - touchGesture.startY
        if (Math.hypot(dx, dy) <= PLAYER_SWIPE_LOCK_PX) {
          seekFromClientX(event.clientX)
        }
      }
      clearTouchGesture()

      if (draggingRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      draggingRef.current = false
      if (event.pointerType !== 'mouse') {
        setIsHovering(false)
      }
    },
    [clearTouchGesture, seekFromClientX]
  )

  const handlePointerLeave = useCallback(() => {
    if (!draggingRef.current) {
      setIsHovering(false)
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isLoading || effectiveDuration <= 0) return

      const baseTime = inChapterScope ? currentChapterStart : 0
      const step = Math.max(1, effectiveDuration * 0.01)
      let nextTime: number | null = null

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          nextTime = Math.min(baseTime + effectiveDuration, currentTime + step)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          nextTime = Math.max(baseTime, currentTime - step)
          break
        case 'Home':
          nextTime = baseTime
          break
        case 'End':
          nextTime = baseTime + effectiveDuration
          break
        default:
          return
      }

      event.preventDefault()
      event.stopPropagation()
      seek(nextTime)
    },
    [currentChapterStart, currentTime, effectiveDuration, inChapterScope, isLoading, seek]
  )

  const showChapterLabel = currentChapter != null && scope !== 'book'
  const showChapterLabelAbove = showChapterLabel && chapterLabelPlacement === 'above'
  const showChapterLabelBelow = showChapterLabel && chapterLabelPlacement === 'below'

  const chapterLabel = showChapterLabel ? (
    <div className="player-track-chapter-label text-foreground-muted flex min-w-0 items-center gap-1">
      <div className="min-w-0 flex-1">
        <PlayerMarqueeText text={currentChapter.title} />
      </div>
      {chapters.length > 0 && currentChapterNumber !== null ? (
        <span className="text-foreground-subdued shrink-0 tabular-nums">
          {t('LabelPlayerChapterNumberMarker', { 0: currentChapterNumber, 1: chapters.length })}
        </span>
      ) : null}
    </div>
  ) : null

  return (
    <div>
      {showChapterLabelAbove ? <div className="player-track-chapter-header mb-1">{chapterLabel}</div> : null}
      <div className="relative">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={sliderLabel}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.round(effectiveDuration))}
          aria-valuenow={Math.max(0, Math.round(playedTime))}
          aria-valuetext={`${currentTimeFormatted} / ${Math.round(playedPercent)}%`}
          className="bg-track-bg relative h-2 w-full cursor-pointer overflow-hidden transition-transform duration-100 hover:scale-y-125"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
        >
          {isHlsTranscode && (
            <div
              className="bg-track-progress/30 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
              style={{ width: `${transcodeReadyPercent}%` }}
            />
          )}
          <div
            className="bg-track-progress/50 pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="bg-track-progress pointer-events-none absolute top-0 left-0 h-full transition-[width] duration-75"
            style={{ width: `${playedPercent}%` }}
          />
          <div
            ref={trackCursorRef}
            className={mergeClasses(
              'bg-track-progress pointer-events-none absolute top-0 left-0 h-full w-0.5 transition-opacity duration-100',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          />
          {isLoading && (
            <div className="via-track-progress/30 loading-track-slide pointer-events-none absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent to-transparent" />
          )}
        </div>

        <div className={mergeClasses('relative h-2 w-full overflow-hidden', inChapterScope ? 'opacity-0' : '')}>
          {chapterTicks.map((tick, index) => (
            <div key={index} className="bg-track-progress/30 pointer-events-none absolute top-0 h-1 w-px" style={{ left: `${tick.left}px` }} />
          ))}
        </div>

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
      <div className="mt-0.5 flex items-center justify-between gap-3">
        <p className="text-foreground-muted shrink-0 font-mono">
          {currentTimeFormatted}
          {' / '}
          {Math.round(playedPercent)}%
        </p>
        {showChapterLabelBelow ? (
          <div className="flex min-w-0 flex-1 items-center justify-center sm:max-w-none">{chapterLabel}</div>
        ) : (
          <span className="flex-1" />
        )}
        <p className="text-foreground-muted shrink-0 font-mono">{timeRemainingFormatted}</p>
      </div>
    </div>
  )
}
