export const ITEM_PAGE_UPDATE_THROTTLE_MS = 200

type TimeoutHandle = ReturnType<typeof setTimeout>

export type LatestSnapshotThrottleOptions<T extends { id: string }> = {
  intervalMs: number
  getCurrentItemId: () => string
  apply: (snapshot: T) => void
  setTimeoutFn?: (fn: () => void, ms: number) => TimeoutHandle
  clearTimeoutFn?: (id: TimeoutHandle) => void
}

export type LatestSnapshotThrottle<T extends { id: string }> = {
  schedule(snapshot: T): void
  reset(): void
}

/**
 * Trailing throttle that keeps only the latest snapshot and flushes it at most once per interval.
 * A new interval starts after each flush while snapshots continue to arrive (not debounce-until-idle).
 * `reset` drops pending work without applying it. Use on item change and unmount.
 */
export function createLatestSnapshotThrottle<T extends { id: string }>(options: LatestSnapshotThrottleOptions<T>): LatestSnapshotThrottle<T> {
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout
  const clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout
  let pending: T | null = null
  let timer: TimeoutHandle | 0 = 0

  const flush = () => {
    timer = 0
    const last = pending
    pending = null
    if (!last) return
    if (last.id !== options.getCurrentItemId()) return
    options.apply(last)
  }

  return {
    schedule(snapshot) {
      if (snapshot.id !== options.getCurrentItemId()) return
      pending = snapshot
      if (!timer) {
        timer = setTimeoutFn(flush, options.intervalMs)
      }
    },
    reset() {
      if (timer) clearTimeoutFn(timer)
      timer = 0
      pending = null
    }
  }
}
