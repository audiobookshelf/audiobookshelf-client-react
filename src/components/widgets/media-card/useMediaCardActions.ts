'use client'

import { removeBookFromCollectionAction } from '@/app/actions/collectionActions'
import {
  deleteLibraryItemAction,
  getExpandedLibraryItemAction,
  removeFromContinueListeningAction,
  removeSeriesFromContinueListeningAction,
  rescanLibraryItemAction,
  sendEbookToDeviceAction,
  toggleFinishedAction
} from '@/app/actions/mediaActions'
import { batchRemoveFromPlaylistAction } from '@/app/actions/playlistActions'
import type { ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useMediaContext } from '@/contexts/MediaContext'
import { useSortableBookshelf } from '@/contexts/SortableBookshelfContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import type { PlayerHandlerControls } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { downloadLibraryItem } from '@/lib/download'
import {
  type BookMetadata,
  type EReaderDevice,
  type LibraryItem,
  type MediaItemShare,
  type MediaProgress,
  type PodcastEpisode,
  isPersonalizedSeriesRef
} from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { MediaCardMoreMenuItem } from './MediaCardMoreMenu'

interface UseMediaCardActionsProps {
  libraryItem: LibraryItem
  media: LibraryItem['media']
  title: string
  author: string | null
  episodeForQueue: PodcastEpisode | null
  mediaProgress: MediaProgress | null | undefined
  itemIsFinished: boolean
  userProgressPercent: number
  isPodcast: boolean
  ereaderDevices: EReaderDevice[]
  continueListeningShelf: boolean
  continueSeriesShelf?: boolean
  libraryItemIdStreaming: string | null
  isStreaming: (libraryItemId: string, episodeId: string | null) => boolean
  isStreamingFromDifferentLib: boolean
  isQueued: boolean
  initialShare?: MediaItemShare | null
  onShareChange?: (share: MediaItemShare | null) => void
  onDeleteSuccess?: () => void
  /** Invoked for the Match menu action. Host owns modal state (card, page, bookshelf, etc.). */
  onOpenMatch?: () => void
  playerControls: PlayerHandlerControls
}

export function useMediaCardActions({
  libraryItem,
  media,
  title,
  author,
  episodeForQueue,
  mediaProgress,
  itemIsFinished,
  userProgressPercent,
  isPodcast,
  ereaderDevices,
  continueListeningShelf,
  continueSeriesShelf = false,
  libraryItemIdStreaming,
  isStreaming,
  isStreamingFromDifferentLib,
  isQueued,
  initialShare = null,
  onShareChange,
  onDeleteSuccess,
  onOpenMatch,
  playerControls
}: UseMediaCardActionsProps) {
  const sortableBookshelf = useSortableBookshelf()
  const t = useTypeSafeTranslations()
  const { userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const { showToast } = useGlobalToast()
  const { addItemToQueue, removeItemFromQueue, playItem } = useMediaContext()
  const [processing, setProcessing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [rssFeedModalOpen, setRssFeedModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false)
  const [playlistsModalOpen, setPlaylistsModalOpen] = useState(false)
  const [mediaItemShare, setMediaItemShare] = useState<MediaItemShare | null>(initialShare)
  const rssFeed = libraryItem.rssFeed ?? null
  const showRssFeedButton = userIsAdminOrUp || rssFeed != null

  useEffect(() => {
    setMediaItemShare(initialShare)
  }, [initialShare])

  const handlePlay = useCallback(() => {
    if (isStreaming(libraryItem.id, episodeForQueue?.id ?? null)) {
      playerControls.playPause()
      return
    }

    startTransition(async () => {
      try {
        setProcessing(true)

        // Fetch the full library item via server action
        const fullLibraryItem = await getExpandedLibraryItemAction(libraryItem.id)

        const queueItems = []

        if (episodeForQueue) {
          const caption =
            episodeForQueue.publishedAt != null
              ? t('LabelPublishedDate', { 0: new Date(episodeForQueue.publishedAt).toLocaleDateString() })
              : t('LabelUnknownPublishDate')

          queueItems.push({
            libraryItemId: libraryItem.id,
            libraryId: libraryItem.libraryId,
            episodeId: episodeForQueue.id,
            title: episodeForQueue.title,
            subtitle: title,
            caption,
            duration: episodeForQueue.audioFile?.duration ?? null,
            coverPath: (media as { coverPath?: string }).coverPath ?? null
          })
        } else {
          queueItems.push({
            libraryItemId: libraryItem.id,
            libraryId: libraryItem.libraryId,
            episodeId: null,
            title,
            subtitle: author || '',
            caption: '',
            duration: (media as { duration?: number }).duration ?? null,
            coverPath: (media as { coverPath?: string }).coverPath ?? null
          })
        }

        playItem({
          libraryItem: fullLibraryItem,
          episodeId: episodeForQueue?.id ?? null,
          queueItems
        })
      } catch (error) {
        console.error('Failed to load library item for playback', error)
        showToast(t('ToastFailedToLoadData'), { type: 'error' })
      } finally {
        setProcessing(false)
      }
    })
  }, [author, episodeForQueue, isStreaming, libraryItem, media, playItem, playerControls, showToast, t, title])

  const handleReadEBook = useCallback(() => {
    startTransition(async () => {
      try {
        setProcessing(true)
        await getExpandedLibraryItemAction(libraryItem.id)
        showToast('E-reader is not implemented yet.', { type: 'info' })
      } catch (error) {
        console.error('Failed to load library item for e-reader', error)
        showToast('Failed to load item for e-reader.', { type: 'error' })
      } finally {
        setProcessing(false)
      }
    })
  }, [libraryItem.id, showToast])

  const toggleFinished = useCallback(
    (confirmed: boolean) => {
      if (!itemIsFinished && userProgressPercent > 0 && !confirmed) {
        setConfirmState({
          isOpen: true,
          message: t('MessageConfirmMarkItemFinished', { 0: title }),
          yesButtonText: t('ButtonYes'),
          yesButtonClassName: 'bg-success',
          onConfirm: () => {
            toggleFinished(true)
            setConfirmState(null)
          }
        })
        return
      }

      startTransition(async () => {
        try {
          setProcessing(true)
          await toggleFinishedAction(libraryItem.id, {
            isFinished: !itemIsFinished,
            episodeId: episodeForQueue?.id
          })
        } catch (error) {
          console.error('Failed to toggle finished', error)
          showToast(!itemIsFinished ? t('ToastItemMarkedAsFinishedFailed') : t('ToastItemMarkedAsNotFinishedFailed'), {
            type: 'error'
          })
        } finally {
          setProcessing(false)
        }
      })
    },
    [episodeForQueue, itemIsFinished, libraryItem.id, showToast, t, title, userProgressPercent]
  )

  const handleMoreAction = useCallback(
    (action: string, data?: Record<string, string>) => {
      if (action === 'addToQueue') {
        const queueItem = {
          libraryItemId: libraryItem.id,
          libraryId: libraryItem.libraryId,
          episodeId: episodeForQueue ? episodeForQueue.id : null,
          title: episodeForQueue ? episodeForQueue.title : title,
          subtitle: episodeForQueue ? title : author || '',
          caption: '',
          duration: episodeForQueue?.audioFile?.duration ?? (media as { duration?: number }).duration ?? null,
          coverPath: (media as { coverPath?: string }).coverPath ?? null
        }
        addItemToQueue(queueItem)
      } else if (action === 'removeFromQueue') {
        const episodeId = episodeForQueue ? episodeForQueue.id : null
        removeItemFromQueue({ libraryItemId: libraryItem.id, episodeId })
      } else if (action === 'openCollections') {
        setCollectionsModalOpen(true)
      } else if (action === 'openPlaylists') {
        setPlaylistsModalOpen(true)
      } else if (action === 'openShare') {
        setShareModalOpen(true)
      } else if (action === 'openRssFeed') {
        setRssFeedModalOpen(true)
      } else if (action === 'showMatchModal') {
        onOpenMatch?.()
      } else if (action === 'download') {
        downloadLibraryItem(libraryItem.id)
      } else if (action === 'sendToDevice') {
        const deviceName = data?.deviceName
        if (!deviceName) return
        setConfirmState({
          isOpen: true,
          message: t('MessageConfirmSendEbookToDevice', {
            0: (media as { ebookFormat?: string }).ebookFormat || '',
            1: title,
            2: deviceName
          }),
          yesButtonText: t('ButtonYes'),
          yesButtonClassName: 'bg-success',
          onConfirm: () => {
            setConfirmState(null)
            startTransition(async () => {
              try {
                setProcessing(true)
                await sendEbookToDeviceAction({ libraryItemId: libraryItem.id, deviceName })
                showToast(t('ToastSendEbookToDeviceSuccess', { 0: deviceName }), { type: 'success' })
              } catch (error) {
                console.error('Failed to send ebook to device', error)
                showToast(t('ToastSendEbookToDeviceFailed'), { type: 'error' })
              } finally {
                setProcessing(false)
              }
            })
          }
        })
      } else if (action === 'toggleFinished') {
        toggleFinished(false)
      } else if (action === 'removeFromSortableList') {
        const ctx = sortableBookshelf
        if (!ctx?.sortableListId || !userCanUpdate) return
        startTransition(async () => {
          try {
            setProcessing(true)
            if (ctx.sortableListKind === 'collection') {
              await removeBookFromCollectionAction(ctx.sortableListId, libraryItem.id)
              showToast(t('ToastRemoveItemFromCollectionSuccess'), { type: 'success' })
            } else {
              await batchRemoveFromPlaylistAction(ctx.sortableListId, [{ libraryItemId: libraryItem.id, episodeId: episodeForQueue?.id ?? null }])
              showToast(t('ToastRemoveItemFromPlaylistSuccess'), { type: 'success' })
            }
            ctx.onLibraryItemRemovedFromSortableList?.(libraryItem.id)
          } catch (error) {
            console.error('Failed to remove item from sortable list', error)
            showToast(ctx.sortableListKind === 'collection' ? t('ToastRemoveItemFromCollectionFailed') : t('ToastRemoveItemFromPlaylistFailed'), {
              type: 'error'
            })
          } finally {
            setProcessing(false)
          }
        })
      } else if (action === 'rescan') {
        startTransition(async () => {
          try {
            setProcessing(true)
            const result = await rescanLibraryItemAction(libraryItem.id)
            const outcome = result?.result
            if (!outcome) {
              showToast('Rescan failed.', { type: 'error' })
            } else if (outcome === 'UPDATED') {
              showToast(t('ToastRescanUpdated'), { type: 'success' })
            } else if (outcome === 'UPTODATE') {
              showToast(t('ToastRescanUpToDate'), { type: 'success' })
            } else if (outcome === 'REMOVED') {
              showToast(t('ToastRescanRemoved'), { type: 'error' })
            }
          } catch (error) {
            console.error('Failed to rescan library item', error)
            showToast(t('ToastScanFailed'), { type: 'error' })
          } finally {
            setProcessing(false)
          }
        })
      } else if (action === 'removeFromContinueListening') {
        const progressId = mediaProgress?.id
        if (!progressId) return
        startTransition(async () => {
          try {
            setProcessing(true)
            await removeFromContinueListeningAction(progressId)
          } catch (error) {
            console.error('Failed to remove from continue listening', error)
            showToast(t('ToastFailedToUpdate'), { type: 'error' })
          } finally {
            setProcessing(false)
          }
        })
      } else if (action === 'removeSeriesFromContinueListening') {
        if (libraryItem.mediaType !== 'book') return
        const { series } = libraryItem.media.metadata as BookMetadata
        const seriesId = series && isPersonalizedSeriesRef(series) ? series.id : null
        if (!seriesId) return
        startTransition(async () => {
          try {
            setProcessing(true)
            await removeSeriesFromContinueListeningAction(seriesId)
          } catch (error) {
            console.error('Failed to remove series from continue series', error)
            showToast(t('ToastFailedToUpdate'), { type: 'error' })
          } finally {
            setProcessing(false)
          }
        })
      } else if (action === 'deleteLibraryItem') {
        setConfirmState({
          isOpen: true,
          message: t('MessageConfirmDeleteLibraryItem'),
          checkboxLabel: t('LabelDeleteFromFileSystemCheckbox'),
          yesButtonText: t('ButtonDelete'),
          yesButtonClassName: 'bg-error',
          onConfirm: (hardDeleteChecked?: boolean) => {
            setConfirmState(null)
            const hardDelete = !!hardDeleteChecked

            // SSR-safe localStorage access
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('softDeleteDefault', hardDelete ? '0' : '1')
              } catch (error) {
                console.warn('Failed to save delete preference to localStorage', error)
              }
            }

            startTransition(async () => {
              try {
                setProcessing(true)
                await deleteLibraryItemAction(libraryItem.id, hardDelete)
                showToast(t('ToastItemDeletedSuccess'), { type: 'success' })
                onDeleteSuccess?.()
              } catch (error) {
                console.error('Failed to delete item', error)
                showToast(t('ToastItemDeletedFailed'), { type: 'error' })
              } finally {
                setProcessing(false)
              }
            })
          }
        })
      }
    },
    [
      addItemToQueue,
      author,
      episodeForQueue,
      libraryItem.id,
      libraryItem.libraryId,
      libraryItem.mediaType,
      libraryItem.media.metadata,
      media,
      mediaProgress,
      removeItemFromQueue,
      showToast,
      t,
      title,
      toggleFinished,
      onDeleteSuccess,
      onOpenMatch,
      sortableBookshelf,
      userCanUpdate
    ]
  )

  const moreMenuItems = useMemo<MediaCardMoreMenuItem[]>(() => {
    const items: MediaCardMoreMenuItem[] = []

    if (!isPodcast) {
      items.push({
        text: itemIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished'),
        func: 'toggleFinished'
      })

      if (userCanUpdate && sortableBookshelf) {
        items.push({
          text: sortableBookshelf.sortableListKind === 'playlist' ? t('LabelRemoveFromPlaylist') : t('LabelRemoveFromCollection'),
          func: 'removeFromSortableList'
        })
      }

      if (userCanUpdate) {
        items.push({
          text: t('LabelAddToCollection'),
          func: 'openCollections'
        })
      }

      if ((media as { duration?: number }).duration) {
        items.push({
          text: t('LabelAddToPlaylist'),
          func: 'openPlaylists'
        })
        if (userIsAdminOrUp) {
          items.push({
            text: t('LabelShare'),
            func: 'openShare'
          })
        }
      }

      const ebookFormat = (media as { ebookFormat?: string }).ebookFormat
      if (ebookFormat && ereaderDevices?.length) {
        items.push({
          text: t('LabelSendEbookToDevice'),
          subitems: ereaderDevices.map((device) => ({
            text: device.name,
            func: 'sendToDevice',
            data: { deviceName: device.name }
          }))
        })
      }
    }

    if (userCanUpdate && onOpenMatch && !episodeForQueue) {
      items.push({
        text: t('HeaderMatch'),
        func: 'showMatchModal'
      })
    }

    if (userIsAdminOrUp && !libraryItem.isFile) {
      items.push({
        text: t('ButtonReScan'),
        func: 'rescan'
      })
    }

    if (continueSeriesShelf && libraryItem.mediaType === 'book') {
      const { series } = libraryItem.media.metadata as BookMetadata
      if (series && isPersonalizedSeriesRef(series)) {
        items.push({
          text: t('ButtonRemoveSeriesFromContinueSeries'),
          func: 'removeSeriesFromContinueListening'
        })
      }
    }

    if (continueListeningShelf) {
      items.push({
        text: (media as { ebookFormat?: string }).ebookFormat ? t('ButtonRemoveFromContinueReading') : t('ButtonRemoveFromContinueListening'),
        func: 'removeFromContinueListening'
      })
    }

    if (showRssFeedButton) {
      items.push({
        text: t('LabelOpenRSSFeed'),
        func: 'openRssFeed'
      })
    }

    if (userCanDownload) {
      items.push({
        text: t('LabelDownload'),
        func: 'download'
      })
    }

    if (!isPodcast && libraryItemIdStreaming && !isStreamingFromDifferentLib) {
      if (!isQueued) {
        items.push({
          text: t('ButtonQueueAddItem'),
          func: 'addToQueue'
        })
      } else if (!isStreaming(libraryItem.id, episodeForQueue?.id ?? null)) {
        items.push({
          text: t('ButtonQueueRemoveItem'),
          func: 'removeFromQueue'
        })
      }
    }

    if (userCanDelete) {
      items.push({
        text: t('ButtonDelete'),
        func: 'deleteLibraryItem'
      })
    }

    return items
  }, [
    continueListeningShelf,
    continueSeriesShelf,
    episodeForQueue,
    ereaderDevices,
    isPodcast,
    isQueued,
    isStreaming,
    isStreamingFromDifferentLib,
    itemIsFinished,
    libraryItem.id,
    libraryItem.isFile,
    libraryItem.mediaType,
    libraryItem.media.metadata,
    libraryItemIdStreaming,
    media,
    showRssFeedButton,
    t,
    userCanDelete,
    userCanDownload,
    userCanUpdate,
    userIsAdminOrUp,
    onOpenMatch,
    sortableBookshelf
  ])

  const closeConfirm = useCallback(() => {
    setConfirmState(null)
  }, [])

  const closeRssFeedModal = useCallback(() => {
    setRssFeedModalOpen(false)
  }, [])

  const closeShareModal = useCallback(() => {
    setShareModalOpen(false)
  }, [])

  const closeCollectionsModal = useCallback(() => {
    setCollectionsModalOpen(false)
  }, [])

  const closePlaylistsModal = useCallback(() => {
    setPlaylistsModalOpen(false)
  }, [])

  const handleShareChange = useCallback(
    (share: MediaItemShare | null) => {
      setMediaItemShare(share)
      onShareChange?.(share)
    },
    [onShareChange]
  )

  return {
    processing: processing || isPending,
    isPending,
    confirmState,
    rssFeedModalOpen,
    shareModalOpen,
    collectionsModalOpen,
    playlistsModalOpen,
    mediaItemShare,
    closeConfirm,
    closeRssFeedModal,
    closeShareModal,
    closeCollectionsModal,
    closePlaylistsModal,
    handleShareChange,
    handlePlay,
    handleReadEBook,
    handleMoreAction,
    moreMenuItems
  }
}
