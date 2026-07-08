'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { useSocketEvent } from '@/contexts/SocketContext'
import type { PodcastEpisodeDownload } from '@/types/api'
import { useCallback, useState } from 'react'

/** TODO(debug): set to false before merge — keeps rows in PodcastDownloadQueueTable */
const DEBUG_KEEP_QUEUE_TABLE_ITEMS = false

interface UseLibraryDownloadQueueSocketOptions {
  initialQueue: PodcastEpisodeDownload[]
  initialCurrentDownload?: PodcastEpisodeDownload
}

interface UseLibraryDownloadQueueSocketReturn {
  episodesDownloading: PodcastEpisodeDownload[]
  episodeDownloadsQueued: PodcastEpisodeDownload[]
}

export function useLibraryDownloadQueueSocket({
  initialQueue,
  initialCurrentDownload
}: UseLibraryDownloadQueueSocketOptions): UseLibraryDownloadQueueSocketReturn {
  const { library } = useLibrary()
  const libraryId = library.id

  const [episodesDownloading, setEpisodesDownloading] = useState<PodcastEpisodeDownload[]>(() => (initialCurrentDownload ? [initialCurrentDownload] : []))
  const [episodeDownloadsQueued, setEpisodeDownloadsQueued] = useState<PodcastEpisodeDownload[]>(initialQueue)

  const handleEpisodeDownloadQueued = useCallback(
    (data: PodcastEpisodeDownload) => {
      if (data.libraryId === libraryId) {
        setEpisodeDownloadsQueued((prev) => [...prev, data])
      }
    },
    [libraryId]
  )

  const handleEpisodeDownloadStarted = useCallback(
    (data: PodcastEpisodeDownload) => {
      if (data.libraryId === libraryId) {
        if (!DEBUG_KEEP_QUEUE_TABLE_ITEMS) {
          setEpisodeDownloadsQueued((prev) => prev.filter((d) => d.id !== data.id))
        }
        setEpisodesDownloading((prev) => [...prev, data])
      }
    },
    [libraryId]
  )

  const handleEpisodeDownloadFinished = useCallback(
    (data: PodcastEpisodeDownload) => {
      if (data.libraryId === libraryId) {
        if (!DEBUG_KEEP_QUEUE_TABLE_ITEMS) {
          setEpisodeDownloadsQueued((prev) => prev.filter((d) => d.id !== data.id))
        }
        setEpisodesDownloading((prev) => prev.filter((d) => d.id !== data.id))
      }
    },
    [libraryId]
  )

  const handleEpisodeDownloadQueueCleared = useCallback((libraryItemId: string) => {
    if (DEBUG_KEEP_QUEUE_TABLE_ITEMS) {
      return
    }
    setEpisodeDownloadsQueued((prev) => prev.filter((d) => d.libraryItemId !== libraryItemId))
  }, [])

  useSocketEvent<PodcastEpisodeDownload>('episode_download_queued', handleEpisodeDownloadQueued, [libraryId])
  useSocketEvent<PodcastEpisodeDownload>('episode_download_started', handleEpisodeDownloadStarted, [libraryId])
  useSocketEvent<PodcastEpisodeDownload>('episode_download_finished', handleEpisodeDownloadFinished, [libraryId])
  useSocketEvent<string>('episode_download_queue_cleared', handleEpisodeDownloadQueueCleared, [libraryId])

  return {
    episodesDownloading,
    episodeDownloadsQueued
  }
}
