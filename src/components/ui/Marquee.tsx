'use client'

import { mergeClasses } from '@/lib/merge-classes'
import {
  DomWrappingMarquee,
  MARQUEE_LOOP_COPY_CLASS,
  MARQUEE_LOOP_GAP_CLASS,
  MARQUEE_LOOP_GAP_SPACES,
  MARQUEE_TRACK_CLASS
} from '@/lib/marquee/domWrappingMarquee'
import { cloneElement, isValidElement, ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
import './Marquee.module.css'

interface MarqueeProps {
  children: ReactNode
  title?: string
  className?: string
  segmentClassName?: string
}

/** Loop-copy links stay clickable while scrolling, but they must not enter the tab order. */
function marqueeLoopCopy(children: ReactNode) {
  if (!isValidElement<{ tabIndex?: number }>(children)) return children
  return cloneElement(children, { tabIndex: -1 })
}

function scheduleDomMarqueeInit(marquee: DomWrappingMarquee) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      marquee.init()
    })
  })
}

function marqueeContentSignature(segment: HTMLElement, loopCopy: HTMLElement) {
  return `${segment.className}\0${segment.textContent}\0${loopCopy.className}\0${loopCopy.textContent}`
}

export default function Marquee({ children, title, className, segmentClassName }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLSpanElement>(null)
  const loopCopyRef = useRef<HTMLSpanElement>(null)
  const marqueeRef = useRef<DomWrappingMarquee | null>(null)
  const signatureRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const segment = segmentRef.current
    const loopCopy = loopCopyRef.current
    if (!container || !track || !segment || !loopCopy) return

    if (!marqueeRef.current) {
      marqueeRef.current = new DomWrappingMarquee(container, track, segment, loopCopy)
    }

    // Parent re-renders must not restart the scroll. Remeasure only when the rendered text or its classes change.
    const signature = marqueeContentSignature(segment, loopCopy)
    if (signature === signatureRef.current) return
    signatureRef.current = signature

    marqueeRef.current.reset()
    scheduleDomMarqueeInit(marqueeRef.current)
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const remeasure = () => {
      if (!marqueeRef.current) return
      scheduleDomMarqueeInit(marqueeRef.current)
    }

    const resizeObserver = new ResizeObserver(remeasure)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    return () => marqueeRef.current?.reset()
  }, [])

  return (
    <div ref={containerRef} className={mergeClasses('relative min-w-0 overflow-hidden', className)} title={title}>
      <div ref={trackRef} className={mergeClasses(MARQUEE_TRACK_CLASS, 'w-max max-w-none whitespace-nowrap will-change-transform')}>
        <span ref={segmentRef} className={mergeClasses('inline-block whitespace-nowrap', segmentClassName)}>
          {children}
        </span>
        {/* Loop copy exists for scrolling but must not take layout until a cycle runs. */}
        <span className={`${MARQUEE_LOOP_GAP_CLASS} pointer-events-none hidden whitespace-pre`} aria-hidden>
          {'\u00A0'.repeat(MARQUEE_LOOP_GAP_SPACES)}
        </span>
        <span ref={loopCopyRef} className={mergeClasses(MARQUEE_LOOP_COPY_CLASS, 'hidden whitespace-nowrap', segmentClassName)} aria-hidden>
          {marqueeLoopCopy(children)}
        </span>
      </div>
    </div>
  )
}
