'use client'

import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import MediaPlayerContainer from '@/components/player/MediaPlayerContainer'
import { useChromecast } from '@/contexts/ChromecastContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import { usePlayerHandler, type PlayerHandler } from '@/hooks/usePlayerHandler'
import { isPodcastLibraryItem, LibraryItem, LibraryItemRemovedPayload, PlayerState } from '@/types/api'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

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

interface MediaNavigationContextValue {
  lastCurrentLibraryId: string | null
  setLastCurrentLibraryId: (libraryId: string) => void
}

interface MediaContextValue {
  // Stream state
  streamLibraryItem: LibraryItem | null
  streamEpisodeId: string | null
  playerQueueItems: PlayerQueueItem[]
  playerQueueAutoPlay: boolean
  setPlayerQueueAutoPlay: (autoPlay: boolean) => void
  currentPlayerQueueIndex: number
  hasNextItemInQueue: boolean
  hasPreviousItemInQueue: boolean
  libraryItemIdStreaming: string | null

  // Stream utilities
  isStreaming: (libraryItemId: string, episodeId?: string | null) => boolean
  isStreamingFromDifferentLibrary: (libraryId?: string) => boolean
  isPlaying: (libraryItemId: string, episodeId?: string | null) => boolean
  getIsMediaQueued: (libraryItemId: string, episodeId?: string | null) => boolean

  // Stream actions
  clearStreamMedia: () => void
  addItemToQueue: (item: PlayerQueueItem) => void
  removeItemFromQueue: (params: { libraryItemId: string; episodeId?: string | null }) => void

  // Main play function
  playItem: (params: { libraryItem: LibraryItem; episodeId?: string | null; startTime?: number; queueItems?: PlayerQueueItem[] }) => Promise<void>
  playQueueItemAtIndex: (index: number) => Promise<void>
  playNextInQueue: () => Promise<void>
  playPreviousInQueue: () => Promise<void>

  // Player handler
  playerHandler: PlayerHandler
}

const MediaNavigationContext = createContext<MediaNavigationContextValue | undefined>(undefined)
const MediaContext = createContext<MediaContextValue | undefined>(undefined)

const LOCAL_STORAGE_AUTO_PLAY_KEY = 'playerQueueAutoPlay'

function readPlayerQueueAutoPlay(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(LOCAL_STORAGE_AUTO_PLAY_KEY) !== '0'
}

export function MediaProvider({ children }: { children: React.ReactNode }) {
  // Current library state
  const [lastCurrentLibraryId, setLastCurrentLibraryId] = useState<string | null>(null)
  // Stream state
  const [streamLibraryItem, setStreamLibraryItem] = useState<LibraryItem | null>(null)
  const [streamEpisodeId, setStreamEpisodeId] = useState<string | null>(null)
  const [playerQueueItems, setPlayerQueueItems] = useState<PlayerQueueItem[]>([])
  const [playerQueueAutoPlay, setPlayerQueueAutoPlayState] = useState<boolean>(() => readPlayerQueueAutoPlay())

  const playerQueueItemsRef = useRef(playerQueueItems)
  playerQueueItemsRef.current = playerQueueItems
  const streamLibraryItemRef = useRef(streamLibraryItem)
  streamLibraryItemRef.current = streamLibraryItem
  const streamEpisodeIdRef = useRef(streamEpisodeId)
  streamEpisodeIdRef.current = streamEpisodeId
  const playerQueueAutoPlayRef = useRef(playerQueueAutoPlay)
  playerQueueAutoPlayRef.current = playerQueueAutoPlay

  const { isCasting } = useChromecast()
  const { state: playerState, controls: playerControls, setOnPlaybackFinished } = usePlayerHandler({ isCasting })

  const libraryItemIdStreaming = useMemo(() => streamLibraryItem?.id ?? null, [streamLibraryItem])

  const setPlayerQueueAutoPlay = useCallback((autoPlay: boolean) => {
    setPlayerQueueAutoPlayState(autoPlay)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_AUTO_PLAY_KEY, autoPlay ? '1' : '0')
    }
  }, [])

  const currentPlayerQueueIndex = useMemo(() => {
    if (!streamLibraryItem) return -1
    const libraryItemId = streamLibraryItem.id
    const episodeId = streamEpisodeId
    return playerQueueItems.findIndex((item) => {
      if (episodeId) return item.libraryItemId === libraryItemId && item.episodeId === episodeId
      return item.libraryItemId === libraryItemId
    })
  }, [playerQueueItems, streamEpisodeId, streamLibraryItem])

  const hasNextItemInQueue = useMemo(
    () => currentPlayerQueueIndex >= 0 && currentPlayerQueueIndex < playerQueueItems.length - 1,
    [currentPlayerQueueIndex, playerQueueItems.length]
  )

  const hasPreviousItemInQueue = useMemo(() => currentPlayerQueueIndex > 0, [currentPlayerQueueIndex])

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

  const isPlaying = useCallback(
    (libraryItemId: string, episodeId?: string | null) => {
      if (!isStreaming(libraryItemId, episodeId)) return false
      return playerState.playerState === PlayerState.PLAYING
    },
    [isStreaming, playerState.playerState]
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

  const pruneQueueForRemovedLibraryItem = useCallback((libraryItemId: string) => {
    setPlayerQueueItems((prev) => prev.filter((item) => item.libraryItemId !== libraryItemId))
  }, [])

  const pruneQueueForPodcastUpdate = useCallback((updatedItem: LibraryItem) => {
    if (!isPodcastLibraryItem(updatedItem)) return

    const episodeIds = new Set((updatedItem.media.episodes ?? []).map((episode) => episode.id))
    setPlayerQueueItems((prev) =>
      prev.filter((item) => {
        if (item.libraryItemId !== updatedItem.id || !item.episodeId) return true
        return episodeIds.has(item.episodeId)
      })
    )
  }, [])

  const handleLibraryItemRemoved = useCallback(
    (payload: LibraryItemRemovedPayload) => {
      pruneQueueForRemovedLibraryItem(payload.id)
    },
    [pruneQueueForRemovedLibraryItem]
  )

  const handleLibraryItemUpdated = useCallback(
    (updatedItem: LibraryItem) => {
      pruneQueueForPodcastUpdate(updatedItem)
    },
    [pruneQueueForPodcastUpdate]
  )

  const handleLibraryItemsUpdated = useCallback(
    (updatedItems: LibraryItem[]) => {
      for (const updatedItem of updatedItems) {
        pruneQueueForPodcastUpdate(updatedItem)
      }
    },
    [pruneQueueForPodcastUpdate]
  )

  useSocketEvent<LibraryItemRemovedPayload>('item_removed', handleLibraryItemRemoved, [handleLibraryItemRemoved])
  useSocketEvent<LibraryItem>('item_updated', handleLibraryItemUpdated, [handleLibraryItemUpdated])
  useSocketEvent<LibraryItem[]>('items_updated', handleLibraryItemsUpdated, [handleLibraryItemsUpdated])

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

  const playQueueItem = useCallback(
    async (item: PlayerQueueItem, queueItems: PlayerQueueItem[]) => {
      try {
        const libraryItem = await getExpandedLibraryItemAction(item.libraryItemId)
        await playItem({
          libraryItem,
          episodeId: item.episodeId,
          queueItems
        })
      } catch (error) {
        console.error('[MediaContext] Failed to play queue item', item, error)
      }
    },
    [playItem]
  )

  const removeItemFromQueue = useCallback(
    ({ libraryItemId, episodeId }: { libraryItemId: string; episodeId?: string | null }) => {
      const isRemovingCurrentStream =
        streamLibraryItemRef.current?.id === libraryItemId && (episodeId ? streamEpisodeIdRef.current === episodeId : !streamEpisodeIdRef.current)

      const prev = playerQueueItemsRef.current
      const currentIndex = prev.findIndex((item) => {
        if (episodeId) return item.libraryItemId === libraryItemId && item.episodeId === episodeId
        return item.libraryItemId === libraryItemId
      })

      const nextQueue = prev.filter((item) => {
        if (!episodeId) return item.libraryItemId !== libraryItemId
        return item.libraryItemId !== libraryItemId || item.episodeId !== episodeId
      })

      setPlayerQueueItems(nextQueue)

      if (isRemovingCurrentStream && playerQueueAutoPlayRef.current && currentIndex >= 0) {
        const nextItem = nextQueue[currentIndex] ?? null
        if (nextItem) {
          void playQueueItem(nextItem, nextQueue)
        } else {
          void clearStreamMedia()
        }
      }
    },
    [clearStreamMedia, playQueueItem]
  )

  const playQueueItemAtIndex = useCallback(
    async (index: number) => {
      const queue = playerQueueItemsRef.current
      const item = queue[index]
      if (!item) {
        console.error('[MediaContext] playQueueItemAtIndex: No item found at index', index)
        return
      }

      await playQueueItem(item, queue)
    },
    [playQueueItem]
  )

  const getCurrentQueueIndex = useCallback(() => {
    const queue = playerQueueItemsRef.current
    const libraryItemId = streamLibraryItemRef.current?.id
    if (!libraryItemId) return -1

    const episodeId = streamEpisodeIdRef.current
    return queue.findIndex((item) => {
      if (episodeId) return item.libraryItemId === libraryItemId && item.episodeId === episodeId
      return item.libraryItemId === libraryItemId
    })
  }, [])

  const playNextInQueue = useCallback(async () => {
    const queue = playerQueueItemsRef.current
    const currentIndex = getCurrentQueueIndex()
    if (currentIndex < 0 || currentIndex >= queue.length - 1) return

    await playQueueItemAtIndex(currentIndex + 1)
  }, [getCurrentQueueIndex, playQueueItemAtIndex])

  const playPreviousInQueue = useCallback(async () => {
    const currentIndex = getCurrentQueueIndex()
    if (currentIndex <= 0) return

    await playQueueItemAtIndex(currentIndex - 1)
  }, [getCurrentQueueIndex, playQueueItemAtIndex])

  const handlePlaybackFinished = useCallback(() => {
    void (async () => {
      const queue = playerQueueItemsRef.current
      if (!queue.length || !playerQueueAutoPlayRef.current) return

      const libraryItemId = streamLibraryItemRef.current?.id
      if (!libraryItemId) return

      const episodeId = streamEpisodeIdRef.current
      let currentQueueIndex = queue.findIndex((item) => {
        if (episodeId) return item.libraryItemId === libraryItemId && item.episodeId === episodeId
        return item.libraryItemId === libraryItemId
      })

      if (currentQueueIndex < 0) {
        console.error('[MediaContext] Media finished not found in queue - using first in queue', queue)
        currentQueueIndex = -1
      }

      if (currentQueueIndex === queue.length - 1) return

      const nextItemInQueue = queue[currentQueueIndex + 1]
      if (!nextItemInQueue) return

      await playQueueItem(nextItemInQueue, queue)
    })()
  }, [playQueueItem])

  useEffect(() => {
    setOnPlaybackFinished(handlePlaybackFinished)
    return () => setOnPlaybackFinished(undefined)
  }, [handlePlaybackFinished, setOnPlaybackFinished])

  // ============================================================================
  // Context Value
  // ============================================================================

  const navigationValue = useMemo(
    (): MediaNavigationContextValue => ({
      lastCurrentLibraryId,
      setLastCurrentLibraryId
    }),
    [lastCurrentLibraryId, setLastCurrentLibraryId]
  )

  const value: MediaContextValue = useMemo(
    () => ({
      // Stream state
      streamLibraryItem,
      streamEpisodeId,
      playerQueueItems,
      playerQueueAutoPlay,
      setPlayerQueueAutoPlay,
      currentPlayerQueueIndex,
      hasNextItemInQueue,
      hasPreviousItemInQueue,
      libraryItemIdStreaming,

      // Stream utilities
      isStreaming,
      isStreamingFromDifferentLibrary,
      isPlaying,
      getIsMediaQueued,

      // Stream actions
      clearStreamMedia,
      addItemToQueue,
      removeItemFromQueue,

      // Main play function
      playItem,
      playQueueItemAtIndex,
      playNextInQueue,
      playPreviousInQueue,

      // Player handler (state + controls)
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
      setPlayerQueueAutoPlay,
      currentPlayerQueueIndex,
      hasNextItemInQueue,
      hasPreviousItemInQueue,
      libraryItemIdStreaming,
      isStreaming,
      isStreamingFromDifferentLibrary,
      isPlaying,
      getIsMediaQueued,
      clearStreamMedia,
      addItemToQueue,
      removeItemFromQueue,
      playItem,
      playQueueItemAtIndex,
      playNextInQueue,
      playPreviousInQueue,
      playerState,
      playerControls
    ]
  )

  return (
    <MediaNavigationContext.Provider value={navigationValue}>
      <MediaContext.Provider value={value}>
        {children}
        <MediaPlayerContainer />
      </MediaContext.Provider>
    </MediaNavigationContext.Provider>
  )
}

export function useMediaNavigation(): MediaNavigationContextValue {
  const ctx = useContext(MediaNavigationContext)
  if (!ctx) {
    throw new Error('useMediaNavigation must be used within a MediaProvider')
  }
  return ctx
}

export function useMediaContext(): MediaContextValue {
  const ctx = useContext(MediaContext)
  if (!ctx) {
    throw new Error('useMediaContext must be used within a MediaProvider')
  }
  return ctx
}
