'use client'

import { DomWrappingMarquee } from '@/lib/player/domWrappingMarquee'
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scheduleDomMarqueeInit(marquee: DomWrappingMarquee) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      marquee.init()
    })
  })
}

/** Drives a horizontal marquee on a DOM segment without replacing React children. */
export function useDomMarquee(
  containerRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  segmentRef: RefObject<HTMLElement | null>,
  deps: unknown[]
) {
  const marqueeRef = useRef<DomWrappingMarquee | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    const segment = segmentRef.current
    if (!container || !track || !segment) return

    if (prefersReducedMotion()) {
      marqueeRef.current?.reset()
      container.style.maskImage = ''
      track.style.transform = ''
      return
    }

    if (!marqueeRef.current) {
      marqueeRef.current = new DomWrappingMarquee(container, track, segment)
    }

    scheduleDomMarqueeInit(marqueeRef.current)
    return () => marqueeRef.current?.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies content deps
  }, deps)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const remeasure = () => {
      if (!marqueeRef.current || prefersReducedMotion()) return
      scheduleDomMarqueeInit(marqueeRef.current)
    }

    const resizeObserver = new ResizeObserver(remeasure)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    return () => marqueeRef.current?.reset()
  }, [])
}
