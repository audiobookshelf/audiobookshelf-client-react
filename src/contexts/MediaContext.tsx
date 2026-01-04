'use client'

import MediaPlayerContainer from '@/components/player/MediaPlayerContainer'
import { usePlayerHandler, type PlayerHandlerControls, type PlayerHandlerState } from '@/hooks/usePlayerHandler'
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
  // Stream state
  streamLibraryItem: LibraryItem | null
  streamEpisodeId: string | null
  playerQueueItems: PlayerQueueItem[]
  playerQueueAutoPlay: boolean
  libraryItemIdStreaming: string | null

  // Stream utilities
  isStreaming: (libraryItemId: string, episodeId?: string | null) => boolean
  isStreamingFromDifferentLibrary: (libraryId?: string) => boolean
  getIsMediaQueued: (libraryItemId: string, episodeId?: string | null) => boolean

  // Stream actions
  clearStreamMedia: () => void
  addItemToQueue: (item: PlayerQueueItem) => void
  removeItemFromQueue: (params: { libraryItemId: string; episodeId?: string | null }) => void

  // Main play function
  playItem: (params: { libraryItem: LibraryItem; episodeId?: string | null; startTime?: number; queueItems?: PlayerQueueItem[] }) => Promise<void>

  // Player handler (state + controls grouped together)
  playerHandler: {
    state: PlayerHandlerState
    controls: PlayerHandlerControls
  }
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  // Stream state
  const [streamLibraryItem, setStreamLibraryItem] = useState<LibraryItem | null>(null)
  const [streamEpisodeId, setStreamEpisodeId] = useState<string | null>(null)
  const [playerQueueItems, setPlayerQueueItems] = useState<PlayerQueueItem[]>([])
  const [playerQueueAutoPlay] = useState<boolean>(true)

  // Player handler hook
  const { state: playerState, controls: playerControls } = usePlayerHandler()

  const libraryItemIdStreaming = useMemo(() => streamLibraryItem?.id ?? null, [streamLibraryItem])

  // ============================================================================
  // Stream Actions
  // ============================================================================

  const clearStreamMedia = useCallback(async () => {
    // Close the player first
    await playerControls.closePlayer()
    // Then clear stream state
    setStreamLibraryItem(null)
    setStreamEpisodeId(null)
    setPlayerQueueItems([])
  }, [playerControls])

  // ============================================================================
  // Stream Utilities
  // ============================================================================

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

  // ============================================================================
  // Queue Actions
  // ============================================================================

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

  // ============================================================================
  // Main Play Function
  // ============================================================================

  const playItem = useCallback(
    async ({
      libraryItem,
      episodeId = null,
      startTime,
      queueItems = []
    }: {
      libraryItem: LibraryItem
      episodeId?: string | null
      startTime?: number
      queueItems?: PlayerQueueItem[]
    }) => {
      // Set stream state
      setStreamLibraryItem(libraryItem)
      setStreamEpisodeId(episodeId)
      setPlayerQueueItems(queueItems)

      // Load and start playback via player handler
      await playerControls.load(libraryItem, episodeId, startTime)
    },
    [playerControls]
  )

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: MediaContextValue = useMemo(
    () => ({
      // Stream state
      streamLibraryItem,
      streamEpisodeId,
      playerQueueItems,
      playerQueueAutoPlay,
      libraryItemIdStreaming,

      // Stream utilities
      isStreaming,
      isStreamingFromDifferentLibrary,
      getIsMediaQueued,

      // Stream actions
      clearStreamMedia,
      addItemToQueue,
      removeItemFromQueue,

      // Main play function
      playItem,

      // Player handler (grouped)
      playerHandler: {
        state: playerState,
        controls: playerControls
      }
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
      clearStreamMedia,
      addItemToQueue,
      removeItemFromQueue,
      playItem,
      playerState,
      playerControls
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
