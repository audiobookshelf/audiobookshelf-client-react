'use client'

import type { UsePlayerHandlerReturn } from '@/hooks/usePlayerHandler'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { PlayerState } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface PlayerTrackBarProps {
  playerHandler: UsePlayerHandlerReturn
}

interface ChapterTick {
  title: string
  left: number
}

export default function PlayerTrackBar({ playerHandler }: PlayerTrackBarProps) {
  const { currentTime, duration, bufferedTime, settings, chapters, playerState, currentChapter } = playerHandler.state
  const { seek } = playerHandler.controls
  const { playbackRate, useChapterTrack } = settings

  const isLoading = playerState === PlayerState.LOADING

  // Refs for DOM elements
  const trackRef = useRef<HTMLDivElement>(null)
  const hoverTimestampRef = useRef<HTMLDivElement>(null)
  const hoverTimestampTextRef = useRef<HTMLParagraphElement>(null)
  const hoverTimestampArrowRef = useRef<HTMLDivElement>(null)
  const trackCursorRef = useRef<HTMLDivElement>(null)

  // State
  const [trackWidth, setTrackWidth] = useState(0)
  const [trackOffsetLeft, setTrackOffsetLeft] = useState(16)
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

  // Measure track width on mount and resize
  const measureTrack = useCallback(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.clientWidth)
      setTrackOffsetLeft(trackRef.current.getBoundingClientRect().left)
    }
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

  // Handle track click to seek
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isLoading || !trackWidth) return

      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return

      const offsetX = e.clientX - rect.left
      const perc = offsetX / trackWidth
      const baseTime = useChapterTrack ? currentChapterStart : 0
      const dur = useChapterTrack ? currentChapterDuration : duration
      const time = baseTime + perc * dur

      if (isNaN(time) || time === null) {
        console.error('Invalid seek time', perc, time)
        return
      }

      seek(time)
    },
    [isLoading, trackWidth, useChapterTrack, currentChapterStart, currentChapterDuration, duration, seek]
  )

  // Handle mouse move over track
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || !trackWidth) return

      const offsetX = e.clientX - rect.left

      const baseTime = useChapterTrack ? currentChapterStart : 0
      const dur = useChapterTrack ? currentChapterDuration : duration
      const progressTime = (offsetX / trackWidth) * dur
      const totalTime = baseTime + progressTime

      // Position hover timestamp
      if (hoverTimestampRef.current) {
        const width = hoverTimestampRef.current.clientWidth
        let posLeft = offsetX - width / 2

        // Keep within bounds
        if (posLeft + width + trackOffsetLeft > window.innerWidth) {
          posLeft = window.innerWidth - width - trackOffsetLeft
        } else if (posLeft < -trackOffsetLeft) {
          posLeft = -trackOffsetLeft
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
    [trackWidth, trackOffsetLeft, useChapterTrack, currentChapterStart, currentChapterDuration, duration, effectivePlaybackRate, chapters]
  )

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  return (
    <div>
      <div className="relative">
        {/* Track */}
        <div
          ref={trackRef}
          className="w-full h-2 bg-gray-700 relative cursor-pointer transition-transform duration-100 hover:scale-y-125 overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleTrackClick}
        >
          {/* Buffer track */}
          <div
            className="h-full bg-gray-500 absolute top-0 left-0 pointer-events-none transition-[width] duration-75"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Played track */}
          <div className="h-full bg-gray-200 absolute top-0 left-0 pointer-events-none transition-[width] duration-75" style={{ width: `${playedPercent}%` }} />
          {/* Track cursor (vertical line on hover) */}
          <div
            ref={trackCursorRef}
            className={mergeClasses(
              'h-full w-0.5 bg-gray-50 absolute top-0 left-0 pointer-events-none transition-opacity duration-100',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          />
          {/* Loading animation - sliding shimmer effect */}
          {isLoading && (
            <div className="h-full w-1/4 absolute top-0 pointer-events-none bg-gradient-to-r from-transparent via-white/30 to-transparent loading-track-slide" />
          )}
        </div>

        {/* Chapter ticks */}
        <div className={mergeClasses('w-full h-2 relative overflow-hidden', useChapterTrack ? 'opacity-0' : '')}>
          {chapterTicks.map((tick, index) => (
            <div key={index} className="absolute top-0 w-px bg-white/30 h-1 pointer-events-none" style={{ left: `${tick.left}px` }} />
          ))}
        </div>

        {/* Hover timestamp */}
        <div
          ref={hoverTimestampRef}
          className={mergeClasses(
            'absolute -top-8 left-0 bg-white text-black rounded-full pointer-events-none z-10 transition-opacity duration-100',
            isHovering ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p ref={hoverTimestampTextRef} className="text-xs font-mono text-center px-2 py-0.5 truncate whitespace-nowrap">
            00:00
          </p>
        </div>

        {/* Hover timestamp arrow */}
        <div
          ref={hoverTimestampArrowRef}
          className={mergeClasses(
            'absolute -top-3.5 left-0 bg-white text-black rounded-full pointer-events-none transition-opacity duration-100',
            isHovering ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="absolute -bottom-1.5 left-0 right-0 w-full flex justify-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-muted font-mono">
          {currentTimeFormatted} / {Math.round(playedPercent)}%
        </p>
        {currentChapter && (
          <p className="text-sm text-foreground-muted">
            {currentChapter.title}{' '}
            {useChapterTrack && (
              <span className="text-xs text-foreground-subdued pl-1">
                ({currentChapterNumber} of {chapters.length})
              </span>
            )}
          </p>
        )}
        <p className="text-sm text-foreground-muted font-mono">{timeRemainingFormatted}</p>
      </div>
    </div>
  )
}
