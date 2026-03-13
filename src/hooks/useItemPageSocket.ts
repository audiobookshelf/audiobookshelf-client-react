'use client'

import { useSocketEvent } from '@/contexts/SocketContext'
import type { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useCallback, useState } from 'react'

// Types for socket events
export interface RssFeed {
  id: string
  entityId: string
  slug: string
  feedUrl: string
}

export interface MediaItemShare {
  id: string
  mediaItemId: string
  slug: string
}

export interface EpisodeDownload {
  id: string
  libraryItemId: string
  episodeId: string
  episodeDisplayTitle?: string
}

interface UseItemPageSocketOptions {
  libraryItemId: string
  mediaId?: string
  isPodcast: boolean
  onItemUpdated?: (libraryItem: BookLibraryItem | PodcastLibraryItem) => void
}

interface UseItemPageSocketReturn {
  rssFeed: RssFeed | null
  mediaItemShare: MediaItemShare | null
  episodesDownloading: EpisodeDownload[]
  episodeDownloadsQueued: EpisodeDownload[]
}

/**
 * Custom hook for handling real-time socket updates on the item page.
 *
 * Listens for:
 * - item_updated: when the library item is modified
 * - rss_feed_open/closed: when RSS feed status changes
 * - share_open/closed: when share status changes
 * - episode_download_queued/started/finished/queue_cleared: podcast episode downloads
 */
export function useItemPageSocket({ libraryItemId, mediaId, isPodcast, onItemUpdated }: UseItemPageSocketOptions): UseItemPageSocketReturn {
  const [rssFeed, setRssFeed] = useState<RssFeed | null>(null)
  const [mediaItemShare, setMediaItemShare] = useState<MediaItemShare | null>(null)
  const [episodesDownloading, setEpisodesDownloading] = useState<EpisodeDownload[]>([])
  const [episodeDownloadsQueued, setEpisodeDownloadsQueued] = useState<EpisodeDownload[]>([])

  // Item updated event
  const handleItemUpdated = useCallback(
    (libraryItem: BookLibraryItem | PodcastLibraryItem) => {
      if (libraryItem.id === libraryItemId) {
        console.log('Item was updated', libraryItem)
        onItemUpdated?.(libraryItem)
      }
    },
    [libraryItemId, onItemUpdated]
  )

  // RSS Feed events
  const handleRssFeedOpen = useCallback(
    (data: RssFeed) => {
      if (data.entityId === libraryItemId) {
        setRssFeed(data)
      }
    },
    [libraryItemId]
  )

  const handleRssFeedClosed = useCallback(
    (data: RssFeed) => {
      if (data.entityId === libraryItemId) {
        setRssFeed(null)
      }
    },
    [libraryItemId]
  )

  // Share events
  const handleShareOpen = useCallback(
    (data: MediaItemShare) => {
      if (data.mediaItemId === mediaId) {
        setMediaItemShare(data)
      }
    },
    [mediaId]
  )

  const handleShareClosed = useCallback(
    (data: MediaItemShare) => {
      if (data.mediaItemId === mediaId) {
        setMediaItemShare(null)
      }
    },
    [mediaId]
  )

  // Episode download events (podcasts only)
  const handleEpisodeDownloadQueued = useCallback(
    (data: EpisodeDownload) => {
      if (data.libraryItemId === libraryItemId) {
        setEpisodeDownloadsQueued((prev) => [...prev, data])
      }
    },
    [libraryItemId]
  )

  const handleEpisodeDownloadStarted = useCallback(
    (data: EpisodeDownload) => {
      if (data.libraryItemId === libraryItemId) {
        setEpisodeDownloadsQueued((prev) => prev.filter((d) => d.id !== data.id))
        setEpisodesDownloading((prev) => [...prev, data])
      }
    },
    [libraryItemId]
  )

  const handleEpisodeDownloadFinished = useCallback(
    (data: EpisodeDownload) => {
      if (data.libraryItemId === libraryItemId) {
        setEpisodeDownloadsQueued((prev) => prev.filter((d) => d.id !== data.id))
        setEpisodesDownloading((prev) => prev.filter((d) => d.id !== data.id))
      }
    },
    [libraryItemId]
  )

  const handleEpisodeDownloadQueueCleared = useCallback(
    (itemId: string) => {
      if (itemId === libraryItemId) {
        setEpisodeDownloadsQueued([])
      }
    },
    [libraryItemId]
  )

  // Register socket event listeners
  useSocketEvent<BookLibraryItem | PodcastLibraryItem>('item_updated', handleItemUpdated, [libraryItemId])
  useSocketEvent<RssFeed>('rss_feed_open', handleRssFeedOpen, [libraryItemId])
  useSocketEvent<RssFeed>('rss_feed_closed', handleRssFeedClosed, [libraryItemId])
  useSocketEvent<MediaItemShare>('share_open', handleShareOpen, [mediaId])
  useSocketEvent<MediaItemShare>('share_closed', handleShareClosed, [mediaId])

  // Episode download events - always register but callbacks filter by isPodcast and libraryItemId
  useSocketEvent<EpisodeDownload>('episode_download_queued', handleEpisodeDownloadQueued, [libraryItemId, isPodcast])
  useSocketEvent<EpisodeDownload>('episode_download_started', handleEpisodeDownloadStarted, [libraryItemId, isPodcast])
  useSocketEvent<EpisodeDownload>('episode_download_finished', handleEpisodeDownloadFinished, [libraryItemId, isPodcast])
  useSocketEvent<string>('episode_download_queue_cleared', handleEpisodeDownloadQueueCleared, [libraryItemId, isPodcast])

  return {
    rssFeed,
    mediaItemShare,
    episodesDownloading,
    episodeDownloadsQueued
  }
}
