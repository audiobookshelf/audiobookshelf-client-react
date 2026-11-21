'use client'

import { revalidateLibraryLayoutAction } from '@/app/actions/libraryActions'
import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { isHistoryTrapActive, subscribeHistoryTrapChange } from '@/lib/historyTrap'
import { useCallback, useEffect, useRef } from 'react'

/** Coalesce a burst of library socket events into one immediate revalidate plus at most one trailing call. */
const REVALIDATE_WINDOW_MS = 300

function libraryIdsIn(data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data)) {
    return data.flatMap((entry) => libraryIdsIn(entry))
  }

  const record = data as { libraryId?: unknown; libraryItem?: unknown }
  const ids: string[] = []
  if (typeof record.libraryId === 'string') ids.push(record.libraryId)
  if (record.libraryItem) ids.push(...libraryIdsIn(record.libraryItem))
  return ids
}

/** Payloads with no library id (share, RSS) apply to the open library. */
function isForOpenLibrary(libraryId: string, data: unknown): boolean {
  const ids = libraryIdsIn(data)
  if (ids.length === 0) return true
  return ids.includes(libraryId)
}

/**
 * Library socket events update the mounted page directly. This drops the router
 * cache for the open library so Back and later visits render current server data.
 */
export default function LibraryRouterRevalidator() {
  const { library } = useLibrary()
  const libraryId = library.id

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingLibraryIdRef = useRef<string | null>(null)
  /** Revalidate requested while a dialog dummy is the current history entry. */
  const deferredLibraryIdRef = useRef<string | null>(null)

  // Next's action response replaceStates the current history entry and drops
  // the dialog dummy marker, so Back no longer closes the dialog and an extra
  // same-URL entry is left behind. Wait until that dummy is gone.
  const requestRevalidate = useCallback((nextLibraryId: string) => {
    if (isHistoryTrapActive()) {
      deferredLibraryIdRef.current = nextLibraryId
      return
    }
    deferredLibraryIdRef.current = null
    void revalidateLibraryLayoutAction(nextLibraryId)
  }, [])

  useEffect(() => {
    return subscribeHistoryTrapChange(() => {
      if (isHistoryTrapActive()) return
      const deferredLibraryId = deferredLibraryIdRef.current
      if (!deferredLibraryId) return
      deferredLibraryIdRef.current = null
      void revalidateLibraryLayoutAction(deferredLibraryId)
    })
  }, [])

  const scheduleRevalidate = useCallback(
    (nextLibraryId: string) => {
      if (timerRef.current) {
        pendingLibraryIdRef.current = nextLibraryId
        return
      }

      requestRevalidate(nextLibraryId)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const pendingLibraryId = pendingLibraryIdRef.current
        pendingLibraryIdRef.current = null
        if (pendingLibraryId) {
          requestRevalidate(pendingLibraryId)
        }
      }, REVALIDATE_WINDOW_MS)
    },
    [requestRevalidate]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const pendingLibraryId = pendingLibraryIdRef.current
      pendingLibraryIdRef.current = null
      if (pendingLibraryId && !isHistoryTrapActive()) {
        void revalidateLibraryLayoutAction(pendingLibraryId)
      }
    }
  }, [])

  const onLibraryDataEvent = useCallback(
    (data: unknown) => {
      if (!isForOpenLibrary(libraryId, data)) return
      scheduleRevalidate(libraryId)
    },
    [libraryId, scheduleRevalidate]
  )

  useSocketEvent('item_added', onLibraryDataEvent)
  useSocketEvent('items_added', onLibraryDataEvent)
  useSocketEvent('item_updated', onLibraryDataEvent)
  useSocketEvent('items_updated', onLibraryDataEvent)
  useSocketEvent('item_removed', onLibraryDataEvent)
  useSocketEvent('episode_added', onLibraryDataEvent)
  useSocketEvent('author_added', onLibraryDataEvent)
  useSocketEvent('author_updated', onLibraryDataEvent)
  useSocketEvent('author_removed', onLibraryDataEvent)
  useSocketEvent('authors_num_books_updated', onLibraryDataEvent)
  useSocketEvent('series_added', onLibraryDataEvent)
  useSocketEvent('series_updated', onLibraryDataEvent)
  useSocketEvent('series_removed', onLibraryDataEvent)
  useSocketEvent('collection_added', onLibraryDataEvent)
  useSocketEvent('collection_updated', onLibraryDataEvent)
  useSocketEvent('collection_removed', onLibraryDataEvent)
  useSocketEvent('playlist_added', onLibraryDataEvent)
  useSocketEvent('playlist_updated', onLibraryDataEvent)
  useSocketEvent('playlist_removed', onLibraryDataEvent)
  useSocketEvent('share_open', onLibraryDataEvent)
  useSocketEvent('share_closed', onLibraryDataEvent)
  useSocketEvent('rss_feed_open', onLibraryDataEvent)
  useSocketEvent('rss_feed_closed', onLibraryDataEvent)

  return null
}
