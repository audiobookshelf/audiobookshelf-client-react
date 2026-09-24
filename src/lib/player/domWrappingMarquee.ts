export const MARQUEE_LOOP_GAP_SPACES = 15
export const MARQUEE_LOOP_GAP_CLASS = 'marquee-loop-gap'
export const MARQUEE_LOOP_COPY_CLASS = 'marquee-loop-copy'
export const MARQUEE_TRACK_CLASS = 'player-marquee-track'
export const MARQUEE_OVERFLOW_CLASS = 'player-marquee--overflow'

const MARQUEE_PAUSE_MS = 2000
const MARQUEE_SCROLL_MS_PER_PX = 30

export function wrappingMarqueeDurationMs(distancePx: number): number {
  return MARQUEE_PAUSE_MS + distancePx * MARQUEE_SCROLL_MS_PER_PX
}

export function wrappingMarqueeHoldPercent(distancePx: number): number {
  const duration = wrappingMarqueeDurationMs(distancePx)
  if (duration <= 0) return 0
  return (MARQUEE_PAUSE_MS / duration) * 100
}

function setMask(el: HTMLElement, showLeft: boolean) {
  el.style.maskImage = showLeft ? 'linear-gradient(90deg, transparent 0%, #fff 10%, #000 90%, transparent)' : 'linear-gradient(90deg, #000 90%, transparent)'
}

/** Distance to slide the loop copy to the original segment's start. */
export function wrappingMarqueeCycleDistance(segmentStart: number, cloneStart: number): number {
  return Math.max(0, cloneStart - segmentStart)
}

/**
 * Marquee for a DOM segment (e.g. React-rendered links) without replacing innerHTML.
 * JS measures overflow and sets --marquee-distance / duration; CSS animates the track.
 * The loop copy stays in the React tree so Next.js Link clicks stay in-app, but it is
 * hidden unless the text overflows — otherwise short names appear twice.
 */
export class DomWrappingMarquee {
  private container: HTMLElement
  private track: HTMLElement
  private segment: HTMLElement
  private loopCopy: HTMLElement

  constructor(container: HTMLElement, track: HTMLElement, segment: HTMLElement, loopCopy: HTMLElement) {
    this.container = container
    this.track = track
    this.segment = segment
    this.loopCopy = loopCopy
    this.setLoopVisible(false)
  }

  private setLoopVisible(visible: boolean) {
    this.loopCopy.style.display = visible ? 'inline-block' : 'none'
    const gap = this.loopCopy.previousElementSibling
    if (gap instanceof HTMLElement) {
      gap.style.display = visible ? 'inline' : 'none'
    }
  }

  private clearOverflow() {
    this.setLoopVisible(false)
    this.container.classList.remove(MARQUEE_OVERFLOW_CLASS)
    this.container.style.removeProperty('--marquee-distance')
    this.container.style.removeProperty('--marquee-dur')
    this.container.style.removeProperty('--marquee-hold')
    this.container.style.maskImage = ''
  }

  reset() {
    this.clearOverflow()
  }

  init() {
    this.reset()

    if (this.segment.offsetWidth <= this.container.clientWidth) {
      return
    }

    this.setLoopVisible(true)
    const distance = wrappingMarqueeCycleDistance(this.segment.getBoundingClientRect().left, this.loopCopy.getBoundingClientRect().left)
    if (distance <= 0) {
      this.clearOverflow()
      return
    }

    this.container.style.setProperty('--marquee-distance', String(distance))
    this.container.style.setProperty('--marquee-dur', `${wrappingMarqueeDurationMs(distance)}ms`)
    this.container.style.setProperty('--marquee-hold', `${wrappingMarqueeHoldPercent(distance)}%`)
    this.container.classList.add(MARQUEE_OVERFLOW_CLASS)
    setMask(this.container, false)
  }
}
