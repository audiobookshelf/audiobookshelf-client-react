'use client'

import { createLatestSnapshotThrottle, ITEM_PAGE_UPDATE_THROTTLE_MS, type LatestSnapshotThrottle } from '@/lib/latestSnapshotThrottle'
import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Coalesce rapid snapshots for the current item id. The latest snapshot is applied at most once per
 * interval while events continue, and the final pending snapshot is still applied after they stop.
 * Pending work is discarded when the item id changes or the component unmounts.
 */
export function useThrottledLatestSnapshot<T extends { id: string }>(
  currentItemId: string,
  apply: (snapshot: T) => void,
  intervalMs = ITEM_PAGE_UPDATE_THROTTLE_MS
): (snapshot: T) => void {
  const applyRef = useRef(apply)
  applyRef.current = apply

  const itemIdRef = useRef(currentItemId)
  itemIdRef.current = currentItemId

  const throttleRef = useRef<LatestSnapshotThrottle<T> | null>(null)
  if (!throttleRef.current) {
    throttleRef.current = createLatestSnapshotThrottle<T>({
      intervalMs,
      getCurrentItemId: () => itemIdRef.current,
      apply: (snapshot) => applyRef.current(snapshot)
    })
  }

  useLayoutEffect(() => {
    return () => {
      throttleRef.current?.reset()
    }
  }, [currentItemId])

  return useCallback((snapshot: T) => {
    throttleRef.current?.schedule(snapshot)
  }, [])
}
