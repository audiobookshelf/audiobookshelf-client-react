import { secondsToTimestamp } from '@/lib/datefns'
import { PLAYER_SWIPE_LOCK_PX, shouldLockPlayerShellHorizontalSeek, shouldLockPlayerShellSwipe } from '@/lib/player/playerShellSwipe'
import type { Chapter } from '@/types/api'
import type { PointerEvent } from 'react'

/** Writable ref box from `useRef` (avoids deprecated `MutableRefObject` in newer `@types/react`). */
type RefBox<T> = { current: T }

export interface TrackTouchGesture {
  pending: boolean
  aborted: boolean
  startX: number
  startY: number
}

interface TrackScopeTiming {
  inChapterScope: boolean
  currentChapterStart: number
  currentChapterDuration: number
  duration: number
}

function trackOffsetFromClientX(clientX: number, rect: DOMRect, timing: TrackScopeTiming) {
  const offsetX = Math.min(rect.width, Math.max(0, clientX - rect.left))
  const perc = offsetX / rect.width
  const baseTime = timing.inChapterScope ? timing.currentChapterStart : 0
  const dur = timing.inChapterScope ? timing.currentChapterDuration : timing.duration
  const progressTime = perc * dur
  return { offsetX, baseTime, dur, progressTime, totalTime: baseTime + progressTime }
}

export function timeFromTrackClientX(clientX: number, rect: DOMRect | undefined, input: TrackScopeTiming & { isLoading: boolean }): number | null {
  if (input.isLoading) return null
  if (!rect || rect.width <= 0) return null

  const { dur, totalTime } = trackOffsetFromClientX(clientX, rect, input)
  if (dur <= 0) return null
  if (isNaN(totalTime)) return null
  return totalTime
}

export function nextKeyboardSeekTime(key: string, currentTime: number, baseTime: number, effectiveDuration: number): number | null {
  const step = Math.max(1, effectiveDuration * 0.01)

  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(baseTime + effectiveDuration, currentTime + step)
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(baseTime, currentTime - step)
    case 'Home':
      return baseTime
    case 'End':
      return baseTime + effectiveDuration
    default:
      return null
  }
}

// Position the tooltip with DOM writes. This runs on every pointer move.
export function updateTrackHoverUi(
  clientX: number,
  elements: {
    track: HTMLDivElement | null
    timestamp: HTMLDivElement | null
    timestampText: HTMLParagraphElement | null
    arrow: HTMLDivElement | null
    cursor: HTMLDivElement | null
  },
  input: TrackScopeTiming & { effectivePlaybackRate: number; chapters: Chapter[] }
): boolean {
  const rect = elements.track?.getBoundingClientRect()
  if (!rect || rect.width <= 0) return false

  const { offsetX, progressTime, totalTime } = trackOffsetFromClientX(clientX, rect, input)

  if (elements.timestamp) {
    const width = elements.timestamp.clientWidth
    let posLeft = offsetX - width / 2
    const trackOffsetLeft = rect.left
    if (posLeft + width + trackOffsetLeft > window.innerWidth) {
      posLeft = window.innerWidth - width - trackOffsetLeft
    } else if (posLeft < -trackOffsetLeft) {
      posLeft = -trackOffsetLeft
    }
    elements.timestamp.style.left = `${posLeft}px`
  }

  if (elements.arrow) {
    elements.arrow.style.left = `${offsetX}px`
    elements.arrow.style.transform = 'translateX(-50%)'
  }

  if (elements.timestampText) {
    let hoverText = secondsToTimestamp(progressTime / input.effectivePlaybackRate)
    const chapter = input.chapters.find((ch) => ch.start <= totalTime && totalTime < ch.end)
    if (chapter?.title) {
      hoverText += ` - ${chapter.title}`
    }
    elements.timestampText.innerText = hoverText
  }

  if (elements.cursor) {
    elements.cursor.style.left = `${offsetX - 1}px`
  }

  return true
}

function isTrackTouchTap(gesture: TrackTouchGesture | null, clientX: number, clientY: number): boolean {
  return Boolean(gesture?.pending && !gesture.aborted && Math.hypot(clientX - gesture.startX, clientY - gesture.startY) <= PLAYER_SWIPE_LOCK_PX)
}

function startDrag(event: PointerEvent<HTMLDivElement>, draggingRef: RefBox<boolean>, previewFromClientX: (clientX: number) => void) {
  event.preventDefault()
  draggingRef.current = true
  event.currentTarget.setPointerCapture(event.pointerId)
  previewFromClientX(event.clientX)
}

export function bindTrackPointer({
  deferTouchSeekToShellGestures,
  draggingRef,
  touchGestureRef,
  previewFromClientX,
  seekFromClientX,
  updateHoverUi,
  setDragPreviewTime,
  setIsHovering
}: {
  deferTouchSeekToShellGestures: boolean
  draggingRef: RefBox<boolean>
  touchGestureRef: RefBox<TrackTouchGesture | null>
  previewFromClientX: (clientX: number) => void
  seekFromClientX: (clientX: number) => void
  updateHoverUi: (clientX: number) => void
  setDragPreviewTime: (time: number | null) => void
  setIsHovering: (hovering: boolean) => void
}) {
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
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

    startDrag(event, draggingRef, previewFromClientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
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
        startDrag(event, draggingRef, previewFromClientX)
      }
      return
    }

    if (draggingRef.current) {
      previewFromClientX(event.clientX)
    } else if (event.pointerType === 'mouse') {
      updateHoverUi(event.clientX)
    }
  }

  const finishPointerGesture = (event: PointerEvent<HTMLDivElement>, shouldSeek: boolean) => {
    const isTap = isTrackTouchTap(touchGestureRef.current, event.clientX, event.clientY)
    if (shouldSeek && (draggingRef.current || isTap)) {
      seekFromClientX(event.clientX)
    }
    touchGestureRef.current = null

    if (draggingRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    draggingRef.current = false
    setDragPreviewTime(null)
    if (event.pointerType !== 'mouse') {
      setIsHovering(false)
    }
  }

  return {
    handlePointerDown,
    handlePointerMove,
    endDrag: (event: PointerEvent<HTMLDivElement>) => {
      finishPointerGesture(event, true)
    },
    cancelDrag: (event: PointerEvent<HTMLDivElement>) => {
      finishPointerGesture(event, false)
    },
    handlePointerLeave: () => {
      if (!draggingRef.current) {
        setIsHovering(false)
      }
    }
  }
}
