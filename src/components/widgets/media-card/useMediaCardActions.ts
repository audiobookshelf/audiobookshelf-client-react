'use client'

import {
  deleteLibraryItemAction,
  getExpandedLibraryItemAction,
  removeFromContinueListeningAction,
  rescanLibraryItemAction,
  sendEbookToDeviceAction,
  toggleFinishedAction
} from '@/app/actions/mediaActions'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EReaderDevice, LibraryItem, MediaProgress, PodcastEpisode, UserPermissions } from '@/types/api'
import { useCallback, useMemo, useState, useTransition, type ReactNode } from 'react'
import { MediaCardMoreMenuItem } from './MediaCardMoreMenu'

interface ConfirmState {
  isOpen: boolean
  message: string | ReactNode
  checkboxLabel?: string
  yesButtonText?: string
  yesButtonClassName?: string
  onConfirm: (checkboxValue?: boolean) => void
}

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
  userPermissions: UserPermissions
  ereaderDevices: EReaderDevice[]
  continueListeningShelf: boolean
  libraryItemIdStreaming: string | null
  isStreaming: (libraryItemId: string, episodeId: string | null) => boolean
  isStreamingFromDifferentLib: boolean
  isQueued: boolean
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
  userPermissions,
  ereaderDevices,
  continueListeningShelf,
  libraryItemIdStreaming,
  isStreaming,
  isStreamingFromDifferentLib,
  isQueued
}: UseMediaCardActionsProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { addItemToQueue, removeItemFromQueue, playItem } = useMediaContext()
  const [processing, setProcessing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const userCanUpdate = userPermissions.update
  const userCanDelete = userPermissions.delete
  const userIsAdminOrUp = userPermissions.accessAllLibraries

  const handlePlay = useCallback(() => {
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
      libraryItemId: libraryItem.id,
      episodeId: episodeForQueue?.id ?? null,
      queueItems
    })
  }, [author, episodeForQueue, libraryItem, media, playItem, t, title])

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
      } else if (action === 'openCollections' || action === 'openPlaylists' || action === 'openShare') {
        showToast('This action is not implemented yet.', { type: 'info' })
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
      media,
      mediaProgress,
      removeItemFromQueue,
      showToast,
      t,
      title,
      toggleFinished
    ]
  )

  const moreMenuItems = useMemo<MediaCardMoreMenuItem[]>(() => {
    const items: MediaCardMoreMenuItem[] = []

    if (!isPodcast) {
      items.push({
        text: itemIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished'),
        func: 'toggleFinished'
      })

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

    if (userCanUpdate) {
      items.push(
        {
          text: t('HeaderFiles'),
          func: 'showEditModalFiles'
        },
        {
          text: t('HeaderMatch'),
          func: 'showEditModalMatch'
        }
      )
    }

    if (userIsAdminOrUp && !libraryItem.isFile) {
      items.push({
        text: t('ButtonReScan'),
        func: 'rescan'
      })
    }

    if (continueListeningShelf) {
      items.push({
        text: (media as { ebookFormat?: string }).ebookFormat ? t('ButtonRemoveFromContinueReading') : t('ButtonRemoveFromContinueListening'),
        func: 'removeFromContinueListening'
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
    episodeForQueue,
    ereaderDevices,
    isPodcast,
    isQueued,
    isStreaming,
    isStreamingFromDifferentLib,
    itemIsFinished,
    libraryItem.id,
    libraryItem.isFile,
    libraryItemIdStreaming,
    media,
    t,
    userCanDelete,
    userCanUpdate,
    userIsAdminOrUp
  ])

  const closeConfirm = useCallback(() => {
    setConfirmState(null)
  }, [])

  return {
    processing: processing || isPending,
    isPending,
    confirmState,
    closeConfirm,
    handlePlay,
    handleReadEBook,
    handleMoreAction,
    moreMenuItems
  }
}
