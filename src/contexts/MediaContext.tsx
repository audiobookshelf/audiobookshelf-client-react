'use client'

import MediaPlayerContainer from '@/components/player/MediaPlayerContainer'
import type { LibraryItem } from '@/types/api'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface PlayerQueueItem {
  libraryItemId: string
  libraryId: string
  episodeId: string | null
  title: string
  subtitle: string
  caption: string
  duration: number | null
  coverPath: string | null
}

interface MediaContextValue {
  streamLibraryItem: LibraryItem | null
  streamEpisodeId: string | null
  playerQueueItems: PlayerQueueItem[]
  playerQueueAutoPlay: boolean

  libraryItemIdStreaming: string | null
  isStreaming: (libraryItemId: string, episodeId?: string | null) => boolean
  isStreamingFromDifferentLibrary: (libraryId?: string) => boolean
  getIsMediaQueued: (libraryItemId: string, episodeId?: string | null) => boolean

  setStreamMedia: (params: { libraryItem: LibraryItem; episodeId?: string | null; queueItems?: PlayerQueueItem[] }) => void
  clearStreamMedia: () => void

  addItemToQueue: (item: PlayerQueueItem) => void
  removeItemFromQueue: (params: { libraryItemId: string; episodeId?: string | null }) => void

  // Placeholder for integration with the actual audio player
  playItem: (params: { libraryItemId: string; episodeId?: string | null; queueItems: PlayerQueueItem[] }) => void
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [streamLibraryItem, setStreamLibraryItem] = useState<LibraryItem | null>(null)
  const [streamEpisodeId, setStreamEpisodeId] = useState<string | null>(null)
  const [playerQueueItems, setPlayerQueueItems] = useState<PlayerQueueItem[]>([])
  const [playerQueueAutoPlay] = useState<boolean>(true)

  const libraryItemIdStreaming = useMemo(() => streamLibraryItem?.id ?? null, [streamLibraryItem])

  const setStreamMedia = useCallback(
    ({ libraryItem, episodeId = null, queueItems = [] }: { libraryItem: LibraryItem; episodeId?: string | null; queueItems?: PlayerQueueItem[] }) => {
      setStreamLibraryItem(libraryItem)
      setStreamEpisodeId(episodeId)
      setPlayerQueueItems(queueItems)
    },
    []
  )

  const clearStreamMedia = useCallback(() => {
    setStreamLibraryItem(null)
    setStreamEpisodeId(null)
    setPlayerQueueItems([])
  }, [])

  const isStreaming = useCallback(
    (libraryItemId: string, episodeId?: string | null) => {
      if (!streamLibraryItem) return false
      if (!episodeId) {
        return streamLibraryItem.id === libraryItemId
      }
      return streamLibraryItem.id === libraryItemId && streamEpisodeId === episodeId
    },
    [streamLibraryItem, streamEpisodeId]
  )

  const isStreamingFromDifferentLibrary = useCallback(
    (libraryId?: string) => {
      if (!streamLibraryItem || !libraryId) return false
      return streamLibraryItem.libraryId !== libraryId
    },
    [streamLibraryItem]
  )

  const getIsMediaQueued = useCallback(
    (libraryItemId: string, episodeId?: string | null) => {
      return playerQueueItems.some((item) => {
        if (!episodeId) return item.libraryItemId === libraryItemId
        return item.libraryItemId === libraryItemId && item.episodeId === episodeId
      })
    },
    [playerQueueItems]
  )

  const addItemToQueue = useCallback((item: PlayerQueueItem) => {
    setPlayerQueueItems((prev) => {
      const exists = prev.some((i) => {
        if (!i.episodeId) return i.libraryItemId === item.libraryItemId
        return i.libraryItemId === item.libraryItemId && i.episodeId === item.episodeId
      })
      if (exists) return prev
      return [...prev, item]
    })
  }, [])

  const removeItemFromQueue = useCallback(({ libraryItemId, episodeId }: { libraryItemId: string; episodeId?: string | null }) => {
    setPlayerQueueItems((prev) =>
      prev.filter((item) => {
        if (!episodeId) return item.libraryItemId !== libraryItemId
        return item.libraryItemId !== libraryItemId || item.episodeId !== episodeId
      })
    )
  }, [])

  const playItem = useCallback(
    ({ libraryItemId, episodeId = null, queueItems }: { libraryItemId: string; episodeId?: string | null; queueItems: PlayerQueueItem[] }) => {
      // For now, just set the stream state and queue locally.
      // Integration with the actual audio player can hook into this later.
      const current = queueItems.find((item) => item.libraryItemId === libraryItemId && (episodeId == null || item.episodeId === episodeId))
      if (!current && queueItems.length === 0) {
        return
      }

      // We don't have the full LibraryItem here, so keep the previous one if IDs match.
      setStreamEpisodeId(episodeId ?? null)
      setPlayerQueueItems(queueItems)
    },
    []
  )

  const value: MediaContextValue = useMemo(
    () => ({
      streamLibraryItem,
      streamEpisodeId,
      playerQueueItems,
      playerQueueAutoPlay,
      libraryItemIdStreaming,
      isStreaming,
      isStreamingFromDifferentLibrary,
      getIsMediaQueued,
      setStreamMedia,
      clearStreamMedia,
      addItemToQueue,
      removeItemFromQueue,
      playItem
    }),
    [
      streamLibraryItem,
      streamEpisodeId,
      playerQueueItems,
      playerQueueAutoPlay,
      libraryItemIdStreaming,
      isStreaming,
      isStreamingFromDifferentLibrary,
      getIsMediaQueued,
      setStreamMedia,
      clearStreamMedia,
      addItemToQueue,
      removeItemFromQueue,
      playItem
    ]
  )

  return (
    <MediaContext.Provider value={value}>
      {children}
      <MediaPlayerContainer />
    </MediaContext.Provider>
  )
}

export function useMediaContext(): MediaContextValue {
  const ctx = useContext(MediaContext)
  if (!ctx) {
    throw new Error('useMediaContext must be used within a MediaProvider')
  }
  return ctx
}
