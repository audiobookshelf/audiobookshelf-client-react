export const PLAYER_SWIPE_THRESHOLD_MINI_PX = 48
export const PLAYER_SWIPE_LOCK_PX = 12

export type PlayerShellSwipeAction = 'expand' | 'collapse' | 'close'

export function isPlayerShellSwipeBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('button, input, textarea, select'))
}

export function shouldLockPlayerShellHorizontalSeek(dx: number, dy: number): boolean {
  return Math.abs(dx) >= PLAYER_SWIPE_LOCK_PX && Math.abs(dx) > Math.abs(dy)
}

export function isVerticalPlayerShellSwipe(dx: number, dy: number): boolean {
  return Math.abs(dy) > Math.abs(dx)
}

export function shouldLockPlayerShellSwipe(dx: number, dy: number): boolean {
  return Math.abs(dy) >= PLAYER_SWIPE_LOCK_PX && isVerticalPlayerShellSwipe(dx, dy)
}

export function resolvePlayerShellSwipeAction(
  dy: number,
  dx: number,
  isFullscreen: boolean,
  miniThresholdPx: number,
  fullscreenThresholdPx: number
): PlayerShellSwipeAction | null {
  if (!isVerticalPlayerShellSwipe(dx, dy)) return null

  if (!isFullscreen) {
    if (dy <= -miniThresholdPx) return 'expand'
    if (dy >= miniThresholdPx) return 'close'
    return null
  }

  if (dy >= fullscreenThresholdPx) return 'collapse'
  return null
}
