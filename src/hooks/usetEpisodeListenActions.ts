'use client'

import { getExpandedLibraryItemAction, toggleFinishedAction } from '@/app/actions/mediaActions'
import type { ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useLibrary } from '@/contexts/LibraryContext'
import type { PlayerQueueItem } from '@/contexts/MediaContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getEpisodeDuration } from '@/lib/episode'
import { formatDuration } from '@/lib/formatDuration'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import type { PodcastEpisode } from '@/types/api'
import { useCallback, useMemo, useState, useTransition } from 'react'

export interface UseEpisodeListenActionsParams {
  libraryItemId: string
  episode: PodcastEpisode
  itemTitle: string
  getQueueItems: () => PlayerQueueItem[]
  buildQueueItem?: () => PlayerQueueItem | null
}

export function useEpisodeListenActions({ libraryItemId, episode, itemTitle, getQueueItems, buildQueueItem }: UseEpisodeListenActionsParams) {
  const t = useTypeSafeTranslations()
  const { library } = useLibrary()
  const libraryId = library.id
  const { user } = useUser()
  const { showToast } = useGlobalToast()
  const {
    playItem,
    isPlaying,
    isStreaming,
    libraryItemIdStreaming,
    isStreamingFromDifferentLibrary,
    getIsMediaQueued,
    addItemToQueue,
    removeItemFromQueue,
    playerControls
  } = useMediaContext()

  const [, startTransition] = useTransition()
  const [isProcessingFinished, setIsProcessingFinished] = useState(false)
  const [playlistsModalOpen, setPlaylistsModalOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const progress = useMemo(() => getMediaItemProgress(user.mediaProgress, libraryItemId, episode.id), [episode.id, libraryItemId, user.mediaProgress])

  const userIsFinished = !!progress?.isFinished
  const userProgressPercent = progress?.progress ?? 0
  const episodeIsPlaying = isPlaying(libraryItemId, episode.id)
  const isQueued = getIsMediaQueued(libraryItemId, episode.id)
  const showQueueButton = !!libraryItemIdStreaming && !isStreamingFromDifferentLibrary(libraryId)

  const durationSeconds = getEpisodeDuration(episode)
  const playButtonLabel = useMemo(() => {
    if (episodeIsPlaying) return t('ButtonPlaying')
    if (!progress) return formatDuration(durationSeconds, t)
    if (progress.isFinished) return t('LabelFinished')

    const currentTime = progress.currentTime || 0
    const duration = progress.duration || durationSeconds
    if (currentTime <= 0) return formatDuration(duration, t)

    const remaining = Math.floor(duration - currentTime)
    return t('LabelTimeLeft', { 0: formatDuration(remaining, t) })
  }, [durationSeconds, episodeIsPlaying, progress, t])

  const closeConfirm = useCallback(() => setConfirmState(null), [])

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (isStreaming(libraryItemId, episode.id)) {
        playerControls.playPause()
        return
      }

      startTransition(async () => {
        try {
          const fullLibraryItem = await getExpandedLibraryItemAction(libraryItemId)
          const queueItems = getQueueItems()
          const startItem = queueItems.find((item) => item.libraryItemId === libraryItemId && item.episodeId === episode.id)
          const startTime = progress && !progress.isFinished && startItem ? progress.currentTime : undefined

          await playItem({
            libraryItem: fullLibraryItem,
            episodeId: episode.id,
            startTime,
            queueItems
          })
        } catch (error) {
          console.error('Failed to load library item for playback', error)
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
        }
      })
    },
    [episode.id, getQueueItems, isStreaming, libraryItemId, playItem, playerControls, progress, showToast, t]
  )

  const handleQueueToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (isQueued) {
        removeItemFromQueue({ libraryItemId, episodeId: episode.id })
        return
      }

      const queueItem = buildQueueItem?.() ?? getQueueItems().find((item) => item.libraryItemId === libraryItemId && item.episodeId === episode.id)
      if (queueItem) {
        addItemToQueue(queueItem)
      }
    },
    [addItemToQueue, buildQueueItem, episode.id, getQueueItems, isQueued, libraryItemId, removeItemFromQueue]
  )

  const toggleFinished = useCallback(
    (confirmed: boolean) => {
      if (!userIsFinished && userProgressPercent > 0 && !confirmed) {
        setConfirmState({
          isOpen: true,
          message: t('MessageConfirmMarkItemFinished', { 0: itemTitle }),
          yesButtonText: t('ButtonYes'),
          yesButtonClassName: 'bg-success',
          onConfirm: () => {
            toggleFinished(true)
            setConfirmState(null)
          }
        })
        return
      }

      setIsProcessingFinished(true)
      startTransition(async () => {
        try {
          await toggleFinishedAction(libraryItemId, {
            isFinished: !userIsFinished,
            episodeId: episode.id
          })
        } catch (error) {
          console.error('Failed to toggle finished', error)
          showToast(!userIsFinished ? t('ToastItemMarkedAsFinishedFailed') : t('ToastItemMarkedAsNotFinishedFailed'), {
            type: 'error'
          })
        } finally {
          setIsProcessingFinished(false)
        }
      })
    },
    [episode.id, itemTitle, libraryItemId, showToast, t, userIsFinished, userProgressPercent]
  )

  const handleToggleFinished = useCallback(() => {
    toggleFinished(false)
  }, [toggleFinished])

  const handleOpenPlaylist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setPlaylistsModalOpen(true)
  }, [])

  const closePlaylistsModal = useCallback(() => setPlaylistsModalOpen(false), [])

  return {
    libraryId,
    progress,
    userIsFinished,
    userProgressPercent,
    episodeIsPlaying,
    isQueued,
    showQueueButton,
    playButtonLabel,
    isProcessingFinished,
    playlistsModalOpen,
    confirmState,
    handlePlay,
    handleQueueToggle,
    handleToggleFinished,
    handleOpenPlaylist,
    closePlaylistsModal,
    closeConfirm
  }
}

export type PodcastEpisodeListenActions = ReturnType<typeof useEpisodeListenActions>
