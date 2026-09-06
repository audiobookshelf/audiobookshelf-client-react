const SCROLL_DELAY_MS = 2000
const SCROLL_SPEED_MS_PER_PX = 30

export const MARQUEE_LOOP_GAP_SPACES = 15

function setMask(el: HTMLElement, showLeft: boolean) {
  el.style.maskImage = showLeft ? 'linear-gradient(90deg, transparent 0%, #fff 10%, #000 90%, transparent)' : 'linear-gradient(90deg, #000 90%, transparent)'
}

/** Distance to slide the loop copy to the original segment's start. */
export function wrappingMarqueeCycleDistance(segmentStart: number, cloneStart: number): number {
  return Math.max(0, cloneStart - segmentStart)
}

/**
 * Marquee for a DOM segment (e.g. React-rendered links) without replacing innerHTML.
 * The loop copy is a second React subtree so Next.js Link clicks stay in-app.
 */
export class DomWrappingMarquee {
  private container: HTMLElement
  private track: HTMLElement
  private segment: HTMLElement
  private loopCopy: HTMLElement
  private isScrolling = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private animationId: number | null = null

  constructor(container: HTMLElement, track: HTMLElement, segment: HTMLElement, loopCopy: HTMLElement) {
    this.container = container
    this.track = track
    this.segment = segment
    this.loopCopy = loopCopy
  }

  startScroll() {
    if (this.isScrolling) return

    this.isScrolling = true
    setMask(this.container, true)

    const textScrollAmount = this.segment.offsetWidth

    // Stop when the copy's first author sits where the original started — one
    // cycle, same as WrappingMarquee (title / chapter).
    const totalScrollAmount = wrappingMarqueeCycleDistance(this.segment.getBoundingClientRect().left, this.loopCopy.getBoundingClientRect().left)

    if (totalScrollAmount <= 0) {
      this.isScrolling = false
      setMask(this.container, false)
      return
    }

    const scrollDuration = totalScrollAmount * SCROLL_SPEED_MS_PER_PX

    let done = false
    let start: number | undefined
    let previousTimeStamp: number | undefined

    const step = (timeStamp: number) => {
      if (start === undefined) {
        start = timeStamp
      }
      const elapsed = timeStamp - start

      if (this.isScrolling && previousTimeStamp !== timeStamp) {
        const amountToMove = Math.min((elapsed / scrollDuration) * totalScrollAmount, totalScrollAmount)
        this.track.style.transform = `translateX(-${amountToMove}px)`
        if (amountToMove === totalScrollAmount) done = true
        if (amountToMove > textScrollAmount) setMask(this.container, false)
      }

      if (!this.isScrolling || done) {
        this.isScrolling = false
        this.track.style.transform = 'translateX(0px)'
        setMask(this.container, false)
        if (done) {
          this.startTimer()
        }
      } else if (elapsed < scrollDuration) {
        previousTimeStamp = timeStamp
        this.animationId = window.requestAnimationFrame(step)
      }
    }

    this.animationId = window.requestAnimationFrame(step)
  }

  startTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => {
      this.startScroll()
    }, SCROLL_DELAY_MS)
  }

  reset() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.isScrolling = false
    if (this.animationId !== null) {
      window.cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.track.style.transform = 'translateX(0px)'
  }

  init() {
    this.reset()

    if (this.segment.offsetWidth > this.container.clientWidth) {
      setMask(this.container, false)
      this.startTimer()
    } else {
      this.container.style.maskImage = ''
    }
  }
}
