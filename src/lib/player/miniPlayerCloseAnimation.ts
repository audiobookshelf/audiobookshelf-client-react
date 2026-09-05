export const PLAYER_MINI_SLIDE_DUR_MS = 250
export const PLAYER_INSET_ANIMATE_CLASS = 'player-inset-animate'
const PLAYER_BOTTOM_SCROLL_EPS_PX = 2

/** @deprecated Use PLAYER_MINI_SLIDE_DUR_MS */
export const PLAYER_MINI_CLOSE_DUR_MS = PLAYER_MINI_SLIDE_DUR_MS

export function getPlayerMiniSlideDurationMs(): number {
  if (typeof window === 'undefined') return PLAYER_MINI_SLIDE_DUR_MS
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
  return PLAYER_MINI_SLIDE_DUR_MS
}

export function getPlayerMiniCloseDurationMs(): number {
  return getPlayerMiniSlideDurationMs()
}

function writeInsetPx(heightPx: number) {
  document.documentElement.style.setProperty('--media-player-height', `${Math.max(0, heightPx)}px`)
}

export function pinMiniPlayerEnterInset() {
  writeInsetPx(0)
}

export function setMediaPlayerHeightPx(heightPx: number) {
  writeInsetPx(heightPx)
}

export function clearMediaPlayerHeightCssVar() {
  document.documentElement.classList.remove(PLAYER_INSET_ANIMATE_CLASS)
  document.documentElement.style.removeProperty('--media-player-height')
}

export function readMediaPlayerHeightPx(): number {
  const inline = document.documentElement.style.getPropertyValue('--media-player-height').trim()
  if (inline.endsWith('px')) {
    const parsed = Number.parseFloat(inline)
    if (!Number.isNaN(parsed)) return parsed
  }

  const computed = getComputedStyle(document.documentElement).getPropertyValue('--media-player-height').trim()
  const parsed = Number.parseFloat(computed)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function isElementScrolledToBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= PLAYER_BOTTOM_SCROLL_EPS_PX
}

function canScrollY(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + PLAYER_BOTTOM_SCROLL_EPS_PX) return false
  const overflowY = getComputedStyle(el).overflowY
  return overflowY === 'auto' || overflowY === 'scroll'
}

export function collectBottomAnchoredScrollers(root: ParentNode = document): HTMLElement[] {
  const found: HTMLElement[] = []
  const scrollingElement = document.scrollingElement
  if (scrollingElement instanceof HTMLElement && isElementScrolledToBottom(scrollingElement)) {
    found.push(scrollingElement)
  }

  for (const node of root.querySelectorAll('*')) {
    if (!(node instanceof HTMLElement)) continue
    if (node === scrollingElement) continue
    if (canScrollY(node) && isElementScrolledToBottom(node)) {
      found.push(node)
    }
  }

  return found
}

interface BottomAnchoredContentScroller {
  scroller: HTMLElement
  content: HTMLElement
}

/**
 * Element scrollers (not the root scrolling element) that are scrolled to the bottom and
 * expose a single content child we can translate. Used by the enter slide, which moves the
 * content with a composited transform instead of reflowing the container each frame.
 */
function collectBottomAnchoredContentScrollers(): BottomAnchoredContentScroller[] {
  const result: BottomAnchoredContentScroller[] = []
  for (const node of document.querySelectorAll('*')) {
    if (!(node instanceof HTMLElement)) continue
    if (node === document.scrollingElement) continue
    if (!canScrollY(node)) continue
    if (!isElementScrolledToBottom(node)) continue
    const content = node.firstElementChild
    if (content instanceof HTMLElement) {
      result.push({ scroller: node, content })
    }
  }
  return result
}

export interface MediaPlayerInsetAnimation {
  finished: Promise<void>
  cancel: () => void
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

/**
 * Slides the mini player up from the bottom while any bottom-anchored page content rides up
 * with it. The inset (`--media-player-height`) is held at 0 for the whole animation so the
 * scroll container never reflows — the player and the content both move via composited
 * transforms driven by one rAF clock. The real inset is committed in a single atomic frame
 * at the end (set height, drop transforms, pin scroll to the new bottom), which lands the
 * content exactly where the last animated frame left it.
 *
 * This avoids the reflow -> scrollHeight -> scrollTop feedback loop that stair-steps the page
 * when the scroll content height is coupled to the container height (e.g. `h-full` content).
 */
export function runMiniPlayerEnterSlide(shellEl: HTMLElement, targetHeightPx: number, durationMs: number, onComplete?: () => void): { cancel: () => void } {
  const contents = collectBottomAnchoredContentScrollers()

  const applyProgress = (eased: number) => {
    shellEl.style.transform = `translate3d(0, ${(1 - eased) * 100}%, 0)`
    const offsetPx = -eased * targetHeightPx
    for (const { content } of contents) {
      content.style.transform = `translate3d(0, ${offsetPx}px, 0)`
    }
  }

  const commit = () => {
    // One atomic layout change: real inset in, transforms out, scroll pinned to the new bottom.
    setMediaPlayerHeightPx(targetHeightPx)
    shellEl.style.transform = ''
    shellEl.style.transition = ''
    shellEl.style.pointerEvents = ''
    for (const { scroller, content } of contents) {
      content.style.transform = ''
      content.style.willChange = ''
      scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight
    }
    document.documentElement.classList.remove(PLAYER_INSET_ANIMATE_CLASS)
  }

  let done = false
  let rafId = 0

  // Cancel leaves the DOM in the committed (final) state but does NOT fire onComplete,
  // so a cancelled run (e.g. StrictMode remount, unmount) cannot flip the caller's state.
  const cancel = () => {
    if (done) return
    done = true
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    commit()
  }

  if (durationMs <= 0 || targetHeightPx <= 0) {
    done = true
    commit()
    onComplete?.()
    return { cancel }
  }

  document.documentElement.classList.add(PLAYER_INSET_ANIMATE_CLASS)
  // Drive the shell transform ourselves; suppress any competing CSS transition.
  shellEl.style.transition = 'none'
  shellEl.style.pointerEvents = 'none'
  for (const { content } of contents) {
    content.style.willChange = 'transform'
  }
  applyProgress(0)

  const startTime = performance.now()

  const frame = (now: number) => {
    if (done) return

    const progress = Math.min(1, (now - startTime) / durationMs)
    applyProgress(easeOutCubic(progress))

    if (progress < 1) {
      rafId = requestAnimationFrame(frame)
    } else {
      done = true
      rafId = 0
      commit()
      onComplete?.()
    }
  }

  rafId = requestAnimationFrame(frame)

  return { cancel }
}

/**
 * Animates `--media-player-height` from `fromPx` to `toPx`, keeping any scrollers that
 * were at the bottom pinned there. Height write and scroll pin happen in the same rAF
 * frame so the two never disagree (avoids the shrink/scroll jitter).
 */
export function animateMediaPlayerInset(fromPx: number, toPx: number, durationMs: number): MediaPlayerInsetAnimation {
  const scrollers = collectBottomAnchoredScrollers()

  const pinScrollers = () => {
    for (const el of scrollers) {
      // Reading scrollHeight/clientHeight forces layout with the height just written,
      // so scrollTop is pinned against this frame's geometry, not the previous one.
      el.scrollTop = el.scrollHeight - el.clientHeight
    }
  }

  let cancelled = false
  let rafId = 0

  const stopAnimating = () => {
    document.documentElement.classList.remove(PLAYER_INSET_ANIMATE_CLASS)
  }

  const cancel = () => {
    cancelled = true
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    stopAnimating()
  }

  const finished = new Promise<void>((resolve) => {
    if (durationMs <= 0) {
      writeInsetPx(toPx)
      pinScrollers()
      resolve()
      return
    }

    document.documentElement.classList.add(PLAYER_INSET_ANIMATE_CLASS)
    writeInsetPx(fromPx)
    pinScrollers()

    const startTime = performance.now()

    const frame = (now: number) => {
      if (cancelled) {
        resolve()
        return
      }

      const progress = Math.min(1, (now - startTime) / durationMs)
      const eased = easeOutCubic(progress)
      writeInsetPx(fromPx + (toPx - fromPx) * eased)
      pinScrollers()

      if (progress < 1) {
        rafId = requestAnimationFrame(frame)
      } else {
        stopAnimating()
        resolve()
      }
    }

    rafId = requestAnimationFrame(frame)
  })

  return { finished, cancel }
}
