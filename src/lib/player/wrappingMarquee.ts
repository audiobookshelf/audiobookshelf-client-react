const SCROLL_DELAY_MS = 2000
/** Milliseconds of animation per pixel scrolled — matches audiobookshelf-app. */
const SCROLL_SPEED_MS_PER_PX = 30
const LOOP_GAP_SPACES = 15

export const MARQUEE_SEGMENT_CLASS = 'marquee-segment'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Marquee text segment — gap between loop copies stays outside this span. */
export function buildMarqueeSegmentHtml(text: string, underline = true): string {
  const classes = underline ? `${MARQUEE_SEGMENT_CLASS} link-underline` : MARQUEE_SEGMENT_CLASS
  return `<span class="${classes}">${escapeHtml(text)}</span>`
}

export interface WrappingMarqueeOptions {
  underline?: boolean
}

function setMask(el: HTMLElement, showLeft: boolean) {
  el.style.maskImage = showLeft ? 'linear-gradient(90deg, transparent 0%, #fff 10%, #000 90%, transparent)' : 'linear-gradient(90deg, #000 90%, transparent)'
}

/**
 * Horizontal marquee for overflowing single-line text. Ported from
 * advplyr/audiobookshelf-app `assets/WrappingMarquee.js`.
 */
export class WrappingMarquee {
  private container: HTMLElement
  private textEl: HTMLElement
  private innerText = ''
  private underline: boolean
  private isScrolling = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private animationId: number | null = null

  constructor(container: HTMLElement, options?: WrappingMarqueeOptions) {
    this.container = container
    this.underline = options?.underline !== false
    const textEl = container.firstElementChild
    if (!(textEl instanceof HTMLElement)) {
      throw new Error('WrappingMarquee requires a single child element')
    }
    this.textEl = textEl
  }

  private buildSegment(text: string): string {
    return buildMarqueeSegmentHtml(text, this.underline)
  }

  startScroll() {
    if (this.isScrolling) return

    this.isScrolling = true
    setMask(this.container, true)

    const textScrollAmount = this.container.scrollWidth
    const loopGap = '&nbsp;'.repeat(LOOP_GAP_SPACES)
    this.textEl.innerHTML = `${this.buildSegment(this.innerText)}${loopGap}`
    const totalScrollAmount = this.container.scrollWidth
    const scrollDuration = totalScrollAmount * SCROLL_SPEED_MS_PER_PX
    this.textEl.innerHTML = this.textEl.innerHTML + this.buildSegment(this.innerText)

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
        this.textEl.style.transform = `translateX(-${amountToMove}px)`
        if (amountToMove === totalScrollAmount) done = true
        if (amountToMove > textScrollAmount) setMask(this.container, false)
      }

      if (!this.isScrolling || done) {
        this.isScrolling = false
        this.textEl.style.transform = 'translateX(0px)'
        this.textEl.innerHTML = this.buildSegment(this.innerText)
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
  }

  init(innerText: string) {
    this.reset()

    this.innerText = innerText
    this.textEl.innerHTML = this.buildSegment(innerText)
    this.textEl.style.transform = 'translateX(0px)'

    if (this.container.scrollWidth > this.container.clientWidth) {
      setMask(this.container, false)
      this.startTimer()
    } else {
      this.container.style.maskImage = ''
    }
  }
}
