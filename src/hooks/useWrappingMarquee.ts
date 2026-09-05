'use client'

import { buildMarqueeSegmentHtml, WrappingMarquee, type WrappingMarqueeOptions } from '@/lib/player/wrappingMarquee'
import { useEffect, useLayoutEffect, useRef } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scheduleMarqueeInit(marquee: WrappingMarquee, text: string) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      marquee.init(text)
    })
  })
}

/**
 * Drives a single-line marquee inside `containerRef` (overflow hidden, one child text node).
 * Re-inits when `text` changes or the container is resized.
 */
export function useWrappingMarquee(text: string, options?: WrappingMarqueeOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<WrappingMarquee | null>(null)
  const underline = options?.underline !== false

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (!marqueeRef.current) {
      marqueeRef.current = new WrappingMarquee(container, { underline })
    }

    const textEl = container.firstElementChild
    if (!(textEl instanceof HTMLElement)) return

    if (prefersReducedMotion()) {
      marqueeRef.current.reset()
      textEl.innerHTML = buildMarqueeSegmentHtml(text, underline)
      textEl.style.transform = ''
      container.style.maskImage = ''
      return
    }

    scheduleMarqueeInit(marqueeRef.current, text)
    return () => marqueeRef.current?.reset()
  }, [text, underline])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const marquee = () => {
      if (!marqueeRef.current || prefersReducedMotion()) return
      scheduleMarqueeInit(marqueeRef.current, text)
    }

    const resizeObserver = new ResizeObserver(marquee)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [text, underline])

  useEffect(() => {
    return () => marqueeRef.current?.reset()
  }, [])

  return containerRef
}
