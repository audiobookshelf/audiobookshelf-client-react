'use client'

import { useGlobalToast } from '@/contexts/ToastContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { buildBookQueueItem, getPodcastItemPagePlaybackParams } from '@/lib/playerQueue'
import type { BookLibraryItem, PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface UseLibraryItemPagePlayOptions {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  /** Filtered/sorted episodes from EpisodeTable (item-page Play). */
  podcastEpisodesInOrder?: PodcastEpisode[]
}

export function useLibraryItemPagePlay({ libraryItem, podcastEpisodesInOrder = [] }: UseLibraryItemPagePlayOptions) {
  const { user, serverSettings } = useUser()
  const { playItem, isStreaming: isStreamingFn, isPlaying: isPlayingFn, playerControls } = useMediaContext()
  const [pendingStartTime, setPendingStartTime] = useState<number | null>(null)
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()

  const isPodcast = libraryItem.mediaType === 'podcast'
  const isBook = libraryItem.mediaType === 'book'
  const bookMedia = !isPodcast ? libraryItem.media : null
  const podcastMedia = isPodcast ? libraryItem.media : null
  const tracks = useMemo(() => (isBook ? (bookMedia?.tracks ?? []) : []), [isBook, bookMedia?.tracks])
  const podcastEpisodes = useMemo(() => (isPodcast ? (podcastMedia?.episodes ?? []) : []), [isPodcast, podcastMedia?.episodes])

  const isStreaming = isStreamingFn(libraryItem.id, null)
  const isItemPlaying = isPlayingFn(libraryItem.id, null)

  const showPlayButton = !libraryItem.isMissing && !libraryItem.isInvalid && (isPodcast ? podcastEpisodes.length > 0 : tracks.length > 0)

  const handlePlay = useCallback(() => {
    if (isStreaming) {
      playerControls.playPause()
      return
    }

    if (isPodcast) {
      if (podcastEpisodesInOrder.length === 0) {
        showToast(t('MessageNoEpisodesToPlay'), { type: 'info' })
        return
      }

      const dateFormat = serverSettings.dateFormat ?? 'MM/dd/yyyy'
      const playback = getPodcastItemPagePlaybackParams(podcastEpisodesInOrder, libraryItem as PodcastLibraryItem, user.mediaProgress, (episode) =>
        episode.publishedAt ? t('LabelPublishedDate', { 0: formatJsDate(new Date(episode.publishedAt), dateFormat) }) : t('LabelUnknownPublishDate')
      )
      if (!playback) return

      void playItem({
        libraryItem,
        episodeId: playback.episodeId,
        queueItems: playback.queueItems
      })
      return
    }

    const queueItem = buildBookQueueItem(libraryItem)
    void playItem({
      libraryItem,
      episodeId: null,
      queueItems: queueItem ? [queueItem] : []
    })
  }, [isPodcast, isStreaming, libraryItem, playItem, playerControls, podcastEpisodesInOrder, serverSettings.dateFormat, showToast, t, user.mediaProgress])

  const handleGoToTimestamp = useCallback(
    (time: number) => {
      if (!isBook) return
      if (isStreaming) {
        playerControls.seek(time)
        return
      }
      setPendingStartTime(time)
    },
    [isBook, isStreaming, playerControls]
  )

  const handleConfirmStartTime = useCallback(() => {
    if (pendingStartTime !== null) {
      if (isStreaming) {
        // Playback started while the dialog was open; seek rather than restart the session.
        playerControls.seek(pendingStartTime)
      } else {
        const queueItem = buildBookQueueItem(libraryItem)
        void playItem({
          libraryItem,
          episodeId: null,
          startTime: pendingStartTime,
          queueItems: queueItem ? [queueItem] : []
        })
      }
    }
    setPendingStartTime(null)
  }, [isStreaming, libraryItem, pendingStartTime, playItem, playerControls])

  return {
    handlePlay,
    showPlayButton,
    isItemPlaying,
    handleGoToTimestamp,
    pendingStartTime,
    setPendingStartTime,
    handleConfirmStartTime
  }
}
