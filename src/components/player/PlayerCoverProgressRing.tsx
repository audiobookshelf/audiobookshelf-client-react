'use client'

import {
  buildRingSamples,
  createRingGeometry,
  getRingPercentAtPoint,
  getRingStartOffsetPercent,
  RING_PAD,
  type RingPoint
} from '@/lib/player/coverRingGeometry'
import { useCallback, useMemo, useRef, useState } from 'react'

interface PlayerCoverProgressRingProps {
  coverWidth: number
  coverHeight: number
  /** Corner radius of the artwork, so the ring stays concentric with it */
  coverRadius: number
  /** Playback progress as a percentage of the total duration */
  progressPercent: number
  /** Blocks scrubbing before the duration is known */
  disabled?: boolean
  /** Percentage under the pointer while scrubbing, null once the drag ends */
  onScrubChange: (percent: number | null) => void
  /** Final percentage to seek to */
  onScrubCommit: (percent: number) => void
}

/**
 * Progress ring drawn around the fullscreen artwork. Doubles as a scrub control.
 *
 * Hidden from assistive tech: it mirrors the track bar below the transport controls,
 * which is the accessible way to seek.
 */
export default function PlayerCoverProgressRing({
  coverWidth,
  coverHeight,
  coverRadius,
  progressPercent,
  disabled = false,
  onScrubChange,
  onScrubCommit
}: PlayerCoverProgressRingProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [scrubPercent, setScrubPercent] = useState<number | null>(null)
  const scrubPercentRef = useRef<number | null>(null)

  const geometry = useMemo(() => createRingGeometry(coverWidth, coverHeight, coverRadius), [coverWidth, coverHeight, coverRadius])
  const samples = useMemo(() => buildRingSamples(geometry), [geometry])
  const startOffsetPercent = useMemo(() => getRingStartOffsetPercent(geometry), [geometry])

  const isScrubbing = scrubPercent !== null
  const displayPercent = scrubPercent ?? Math.min(100, Math.max(0, progressPercent))

  const percentFromEvent = useCallback(
    (event: React.PointerEvent<SVGRectElement>): number | null => {
      const svg = svgRef.current
      if (!svg) return null

      const rect = svg.getBoundingClientRect()
      if (!rect.width || !rect.height) return null

      const point: RingPoint = {
        x: (event.clientX - rect.left) * (geometry.viewWidth / rect.width),
        y: (event.clientY - rect.top) * (geometry.viewHeight / rect.height)
      }

      return getRingPercentAtPoint(geometry, samples, point)
    },
    [geometry, samples]
  )

  const updateScrub = useCallback(
    (percent: number | null) => {
      scrubPercentRef.current = percent
      setScrubPercent(percent)
      onScrubChange(percent)
    },
    [onScrubChange]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      if (disabled) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      updateScrub(percentFromEvent(event) ?? 0)
    },
    [disabled, percentFromEvent, updateScrub]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      if (scrubPercentRef.current === null) return

      const percent = percentFromEvent(event)
      if (percent !== null) updateScrub(percent)
    },
    [percentFromEvent, updateScrub]
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      const percent = scrubPercentRef.current
      if (percent === null) return

      event.currentTarget.releasePointerCapture(event.pointerId)
      updateScrub(null)
      onScrubCommit(percent)
    },
    [onScrubCommit, updateScrub]
  )

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      if (scrubPercentRef.current === null) return

      event.currentTarget.releasePointerCapture(event.pointerId)
      updateScrub(null)
    },
    [updateScrub]
  )

  const trackWidth = geometry.viewWidth - geometry.stroke
  const trackHeight = geometry.viewHeight - geometry.stroke
  const trackOrigin = geometry.stroke / 2

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="absolute"
      style={{ top: -RING_PAD, left: -RING_PAD, width: geometry.viewWidth, height: geometry.viewHeight }}
      viewBox={`0 0 ${geometry.viewWidth} ${geometry.viewHeight}`}
    >
      <rect
        x={trackOrigin}
        y={trackOrigin}
        width={trackWidth}
        height={trackHeight}
        rx={geometry.radius}
        fill="none"
        stroke="rgb(255 255 255 / 0.18)"
        strokeWidth={geometry.stroke}
        className="pointer-events-none"
      />
      <rect
        x={trackOrigin}
        y={trackOrigin}
        width={trackWidth}
        height={trackHeight}
        rx={geometry.radius}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={isScrubbing ? geometry.stroke + 2 : geometry.stroke}
        pathLength={100}
        strokeDasharray={`${displayPercent} ${100 - displayPercent}`}
        strokeDashoffset={-startOffsetPercent}
        className="pointer-events-none transition-[stroke-width] duration-100"
      />
      {/* Widened transparent copy so the ring is easy to grab */}
      <rect
        x={trackOrigin}
        y={trackOrigin}
        width={trackWidth}
        height={trackHeight}
        rx={geometry.radius}
        fill="none"
        stroke="transparent"
        strokeWidth={26}
        style={{ pointerEvents: disabled ? 'none' : 'stroke', cursor: 'pointer', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </svg>
  )
}
