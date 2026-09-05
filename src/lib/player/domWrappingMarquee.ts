const SCROLL_DELAY_MS = 2000
const SCROLL_SPEED_MS_PER_PX = 30
const LOOP_GAP_SPACES = 15

function setMask(el: HTMLElement, showLeft: boolean) {
  el.style.maskImage = showLeft ? 'linear-gradient(90deg, transparent 0%, #fff 10%, #000 90%, transparent)' : 'linear-gradient(90deg, #000 90%, transparent)'
}

/** Distance to slide the loop clone to the original segment's start. */
export function wrappingMarqueeCycleDistance(segmentStart: number, cloneStart: number): number {
  return Math.max(0, cloneStart - segmentStart)
}

/**
 * Marquee for a DOM segment (e.g. React-rendered links) without replacing innerHTML.
 * Clones the segment node for the loop copy so Next.js Link components stay intact.
 */
export class DomWrappingMarquee {
  private container: HTMLElement
  private track: HTMLElement
  private segment: HTMLElement
  private isScrolling = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private animationId: number | null = null
  private loopNodes: HTMLElement[] = []

  constructor(container: HTMLElement, track: HTMLElement, segment: HTMLElement) {
    this.container = container
    this.track = track
    this.segment = segment
  }

  private clearLoopNodes() {
    for (const node of this.loopNodes) {
      node.remove()
    }
    this.loopNodes = []

    for (const child of [...this.track.children]) {
      if (child !== this.segment) child.remove()
    }
  }

  startScroll() {
    if (this.isScrolling) return

    this.clearLoopNodes()

    const clone = this.segment.cloneNode(true)
    if (!(clone instanceof HTMLElement)) return

    this.isScrolling = true
    setMask(this.container, true)

    const textScrollAmount = this.segment.offsetWidth
    const gap = document.createElement('span')
    gap.innerHTML = '&nbsp;'.repeat(LOOP_GAP_SPACES)
    gap.style.pointerEvents = 'none'
    gap.setAttribute('aria-hidden', 'true')
    clone.style.display = 'inline-block'
    clone.style.pointerEvents = 'none'
    clone.setAttribute('aria-hidden', 'true')

    this.track.append(gap, clone)
    this.loopNodes.push(gap, clone)

    // Stop when the clone's first author sits where the original started — one
    // cycle, same as WrappingMarquee (title / chapter).
    const totalScrollAmount = wrappingMarqueeCycleDistance(this.segment.getBoundingClientRect().left, clone.getBoundingClientRect().left)

    if (totalScrollAmount <= 0) {
      this.isScrolling = false
      this.clearLoopNodes()
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
        this.clearLoopNodes()
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
    this.clearLoopNodes()
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
