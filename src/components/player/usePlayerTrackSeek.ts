'use client'

import { getPlayerTrackScope, type PlayerTrackScope } from '@/components/player/playerTrackDisplay'
import {
  bindTrackPointer,
  nextKeyboardSeekTime,
  timeFromTrackClientX,
  updateTrackHoverUi,
  type TrackTouchGesture
} from '@/components/player/playerTrackPointer'
import { PlayerState, type Chapter } from '@/types/api'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'

export interface PlayerTrackSeekController {
  trackRef: RefObject<HTMLDivElement | null>
  hoverTimestampRef: RefObject<HTMLDivElement | null>
  hoverTimestampTextRef: RefObject<HTMLParagraphElement | null>
  hoverTimestampArrowRef: RefObject<HTMLDivElement | null>
  trackCursorRef: RefObject<HTMLDivElement | null>
  trackWidth: number
  isHovering: boolean
  dragPreviewTime: number | null
  handlePointerDown: (event: PointerEvent<HTMLDivElement>) => void
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void
  endDrag: (event: PointerEvent<HTMLDivElement>) => void
  cancelDrag: (event: PointerEvent<HTMLDivElement>) => void
  handlePointerLeave: () => void
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

interface UsePlayerTrackSeekParams {
  scope: PlayerTrackScope
  useChapterTrack: boolean
  chapters: Chapter[]
  currentTime: number
  duration: number
  playbackRate: number
  isLoading: boolean
  playerState: PlayerState
  seek: (time: number) => void
  deferTouchSeekToShellGestures: boolean
}

export function usePlayerTrackSeek({
  scope,
  useChapterTrack,
  chapters,
  currentTime,
  duration,
  playbackRate,
  isLoading,
  playerState,
  seek,
  deferTouchSeekToShellGestures
}: UsePlayerTrackSeekParams): PlayerTrackSeekController {
  const { currentChapterStart, currentChapterDuration, inChapterScope, effectiveDuration, effectivePlaybackRate } = getPlayerTrackScope({
    scope,
    useChapterTrack,
    chapters,
    currentTime,
    duration,
    playbackRate
  })

  const trackRef = useRef<HTMLDivElement>(null)
  const hoverTimestampRef = useRef<HTMLDivElement>(null)
  const hoverTimestampTextRef = useRef<HTMLParagraphElement>(null)
  const hoverTimestampArrowRef = useRef<HTMLDivElement>(null)
  const trackCursorRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const touchGestureRef = useRef<TrackTouchGesture | null>(null)

  const [trackWidth, setTrackWidth] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [dragPreviewTime, setDragPreviewTime] = useState<number | null>(null)

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
      const updated = updateTrackHoverUi(
        clientX,
        {
          track: trackRef.current,
          timestamp: hoverTimestampRef.current,
          timestampText: hoverTimestampTextRef.current,
          arrow: hoverTimestampArrowRef.current,
          cursor: trackCursorRef.current
        },
        {
          inChapterScope,
          currentChapterStart,
          currentChapterDuration,
          duration,
          effectivePlaybackRate,
          chapters
        }
      )
      if (updated) setIsHovering(true)
    },
    [chapters, currentChapterDuration, currentChapterStart, duration, effectivePlaybackRate, inChapterScope]
  )

  const timeFromClientX = useCallback(
    (clientX: number) =>
      timeFromTrackClientX(clientX, trackRef.current?.getBoundingClientRect(), {
        isLoading,
        inChapterScope,
        currentChapterStart,
        currentChapterDuration,
        duration
      }),
    [currentChapterDuration, currentChapterStart, duration, inChapterScope, isLoading]
  )

  const previewFromClientX = useCallback(
    (clientX: number) => {
      const time = timeFromClientX(clientX)
      if (time == null) return
      setDragPreviewTime(time)
      updateHoverUi(clientX)
    },
    [timeFromClientX, updateHoverUi]
  )

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const time = timeFromClientX(clientX)
      if (time == null) return
      seek(time)
    },
    [seek, timeFromClientX]
  )

  const pointer = bindTrackPointer({
    deferTouchSeekToShellGestures,
    draggingRef,
    touchGestureRef,
    previewFromClientX,
    seekFromClientX,
    updateHoverUi,
    setDragPreviewTime,
    setIsHovering
  })

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (isLoading || effectiveDuration <= 0) return

      const baseTime = inChapterScope ? currentChapterStart : 0
      const nextTime = nextKeyboardSeekTime(event.key, currentTime, baseTime, effectiveDuration)
      if (nextTime == null) return

      event.preventDefault()
      event.stopPropagation()
      seek(nextTime)
    },
    [currentChapterStart, currentTime, effectiveDuration, inChapterScope, isLoading, seek]
  )

  return {
    trackRef,
    hoverTimestampRef,
    hoverTimestampTextRef,
    hoverTimestampArrowRef,
    trackCursorRef,
    trackWidth,
    isHovering,
    dragPreviewTime,
    handleKeyDown,
    ...pointer
  }
}
