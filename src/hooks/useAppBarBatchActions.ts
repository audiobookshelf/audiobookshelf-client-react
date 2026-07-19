'use client'

import type { AppBarBatchActionModalsProps } from '@/components/widgets/AppBarBatchActionModals'
import type { ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { writeBatchEditSession } from '@/lib/batchEdit'
import { buildSelectedBooksPlayPayload, buildSelectedEpisodesPlayPayload } from '@/lib/batchSelection/selectionPlayback'
import {
  deleteEpisodesSelection,
  deleteLibraryItemsSelection,
  downloadEpisodesSelection,
  downloadLibraryItemsSelection,
  embedMetadataSelection,
  rescanLibraryItemsSelection,
  toggleFinishedSelection
} from '@/lib/batchSelection/selectionUtils'
import { openHardDeleteConfirm, openSimpleConfirm } from '@/lib/confirmDialogs'
import type { SelectedMediaItem, SelectionKind } from '@/lib/selectedMediaItem'
import { usePathname, useRouter } from 'next/navigation'
import { createElement, useCallback, useEffect, useMemo, useState, useTransition } from 'react'

export type AppBarBatchActionId =
  | 'play'
  | 'toggle-finished'
  | 'add-to-collection'
  | 'add-to-playlist'
  | 'batch-edit'
  | 'delete'
  | 'quick-match'
  | 'quick-embed'
  | 'rescan'
  | 'download'

interface UseAppBarBatchActionsParams {
  selectedItems: readonly SelectedMediaItem[]
  selectionKind: SelectionKind
  libraryId?: string
  allFinished: boolean
  clearSelection?: () => void
}

export interface AppBarBatchActionsResult {
  onBatchAction: (action: AppBarBatchActionId) => void
  processing: boolean
  confirmState: ConfirmState | null
  closeConfirm: () => void
  modalsProps: AppBarBatchActionModalsProps
}

export function useAppBarBatchActions({
  selectedItems,
  selectionKind,
  libraryId,
  allFinished,
  clearSelection
}: UseAppBarBatchActionsParams): AppBarBatchActionsResult {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const { showToast } = useGlobalToast()
  const { playItem } = useMediaContext()
  const [isPending, startTransition] = useTransition()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false)
  const [playlistsModalOpen, setPlaylistsModalOpen] = useState(false)
  const [quickMatchModalOpen, setQuickMatchModalOpen] = useState(false)

  const uniqueLibraryItemIds = useMemo(() => [...new Set(selectedItems.map((item) => item.libraryItemId))], [selectedItems])
  const playlistItems = useMemo(() => selectedItems.map((item) => ({ libraryItemId: item.libraryItemId, episodeId: item.episodeId ?? null })), [selectedItems])

  const finishBatchAction = useCallback(() => clearSelection?.(), [clearSelection])

  useEffect(() => {
    if (selectedItems.length === 0) {
      setCollectionsModalOpen(false)
      setPlaylistsModalOpen(false)
      setQuickMatchModalOpen(false)
    }
  }, [selectedItems.length])

  const modalsProps = useMemo(
    (): AppBarBatchActionModalsProps => ({
      libraryId,
      libraryItemIds: uniqueLibraryItemIds,
      playlistItems,
      playlistSelectionKind: selectionKind,
      collectionsModalOpen,
      playlistsModalOpen,
      quickMatchModalOpen,
      onCloseCollectionsModal: () => setCollectionsModalOpen(false),
      onClosePlaylistsModal: () => setPlaylistsModalOpen(false),
      onCloseQuickMatchModal: () => setQuickMatchModalOpen(false),
      onQuickMatchSuccess: finishBatchAction
    }),
    [collectionsModalOpen, finishBatchAction, libraryId, playlistItems, playlistsModalOpen, quickMatchModalOpen, selectionKind, uniqueLibraryItemIds]
  )

  const runBatch = useCallback(
    (work: () => Promise<void>, options: { logLabel: string; successToast?: string; errorToast?: string; onSuccess?: () => void }) => {
      startTransition(async () => {
        try {
          await work()
          if (options.successToast) showToast(options.successToast, { type: 'success' })
          options.onSuccess?.()
        } catch (error) {
          console.error(options.logLabel, error)
          if (options.errorToast) showToast(options.errorToast, { type: 'error' })
        }
      })
    },
    [showToast]
  )

  const handlePlay = useCallback(() => {
    if (!libraryId || selectedItems.length === 0) return
    const isEpisode = selectionKind === 'episode'
    runBatch(
      async () => {
        const payload = isEpisode
          ? await buildSelectedEpisodesPlayPayload(selectedItems)
          : await buildSelectedBooksPlayPayload(selectedItems, uniqueLibraryItemIds)
        await playItem(payload)
      },
      {
        logLabel: isEpisode ? 'Failed to play selected episodes' : 'Failed to play selected books',
        errorToast: t('ToastFailedToLoadData'),
        onSuccess: finishBatchAction
      }
    )
  }, [finishBatchAction, libraryId, playItem, runBatch, selectedItems, selectionKind, t, uniqueLibraryItemIds])

  const handleToggleFinished = useCallback(() => {
    if (selectedItems.length === 0) return
    runBatch(async () => toggleFinishedSelection(selectedItems, allFinished), {
      logLabel: 'Failed to batch update finished state',
      successToast: t('ToastBatchUpdateSuccess'),
      errorToast: t('ToastBatchUpdateFailed'),
      onSuccess: finishBatchAction
    })
  }, [allFinished, finishBatchAction, runBatch, selectedItems, t])

  const handleDeleteLibraryItems = useCallback(() => {
    openHardDeleteConfirm({
      message: t('MessageConfirmDeleteLibraryItems', { 0: selectedItems.length }),
      t,
      setConfirmState,
      onDelete: (hardDelete) => {
        runBatch(async () => deleteLibraryItemsSelection(uniqueLibraryItemIds, hardDelete), {
          logLabel: 'Failed to batch delete library items',
          successToast: t('ToastBatchDeleteSuccess'),
          errorToast: t('ToastBatchDeleteFailed'),
          onSuccess: finishBatchAction
        })
      }
    })
  }, [finishBatchAction, runBatch, selectedItems.length, t, uniqueLibraryItemIds])

  const handleDeleteEpisodes = useCallback(() => {
    openHardDeleteConfirm({
      message: t('MessageConfirmRemoveEpisodes', { count: selectedItems.length }),
      t,
      setConfirmState,
      onDelete: (hardDelete) => {
        runBatch(async () => deleteEpisodesSelection(selectedItems, hardDelete), {
          logLabel: 'Failed to batch delete episodes',
          successToast: t('ToastEpisodeBatchDeleteSuccess'),
          errorToast: t('ToastEpisodeBatchDeleteFailed'),
          onSuccess: finishBatchAction
        })
      }
    })
  }, [finishBatchAction, runBatch, selectedItems, t])

  const handleDownload = useCallback(() => {
    if (!libraryId) return

    if (selectionKind === 'episode') {
      runBatch(async () => downloadEpisodesSelection(selectedItems), {
        logLabel: 'Failed to download selected episodes',
        successToast: t('ToastStartedDownloadingEpisodes'),
        errorToast: t('ToastFailedToLoadData'),
        onSuccess: finishBatchAction
      })
      return
    }

    runBatch(
      async () => {
        downloadLibraryItemsSelection(libraryId, uniqueLibraryItemIds)
      },
      {
        logLabel: 'Failed to batch download library items',
        successToast: t('ToastBatchDownloadSuccess'),
        onSuccess: finishBatchAction
      }
    )
  }, [finishBatchAction, libraryId, runBatch, selectedItems, selectionKind, t, uniqueLibraryItemIds])

  const handleRescan = useCallback(() => {
    openSimpleConfirm({
      message: t('MessageConfirmReScanLibraryItems', { 0: selectedItems.length }),
      yesButtonText: t('ButtonYes'),
      yesButtonClassName: 'bg-success',
      setConfirmState,
      onConfirm: () => {
        runBatch(async () => rescanLibraryItemsSelection(uniqueLibraryItemIds), {
          logLabel: 'Failed to batch rescan library items',
          successToast: t('ToastBatchRescanStarted'),
          errorToast: t('ToastScanFailed'),
          onSuccess: finishBatchAction
        })
      }
    })
  }, [finishBatchAction, runBatch, selectedItems.length, t, uniqueLibraryItemIds])

  const handleQuickEmbed = useCallback(() => {
    openSimpleConfirm({
      message: t.rich('MessageConfirmQuickEmbed', { br: () => createElement('br') }),
      yesButtonText: t('ButtonYes'),
      yesButtonClassName: 'bg-success',
      setConfirmState,
      onConfirm: () => {
        runBatch(async () => embedMetadataSelection(uniqueLibraryItemIds), {
          logLabel: 'Failed to batch embed metadata',
          successToast: t('MessageQuickEmbedQueue', { count: uniqueLibraryItemIds.length }),
          errorToast: t('ToastFailedToUpdate'),
          onSuccess: finishBatchAction
        })
      }
    })
  }, [finishBatchAction, runBatch, t, uniqueLibraryItemIds])

  const onBatchAction = useCallback(
    (action: AppBarBatchActionId) => {
      if (isPending || selectedItems.length === 0) return

      switch (action) {
        case 'batch-edit':
          if (!libraryId) return
          writeBatchEditSession({ libraryId, selectionKind, items: [...selectedItems], returnPath: pathname })
          router.push(`/library/${libraryId}/batch`)
          break
        case 'play':
          handlePlay()
          break
        case 'toggle-finished':
          handleToggleFinished()
          break
        case 'add-to-collection':
          setCollectionsModalOpen(true)
          break
        case 'add-to-playlist':
          setPlaylistsModalOpen(true)
          break
        case 'delete':
          if (selectionKind === 'episode') handleDeleteEpisodes()
          else handleDeleteLibraryItems()
          break
        case 'quick-match':
          setQuickMatchModalOpen(true)
          break
        case 'quick-embed':
          handleQuickEmbed()
          break
        case 'rescan':
          handleRescan()
          break
        case 'download':
          handleDownload()
          break
      }
    },
    [
      handleDeleteEpisodes,
      handleDeleteLibraryItems,
      handleDownload,
      handlePlay,
      handleQuickEmbed,
      handleRescan,
      handleToggleFinished,
      isPending,
      libraryId,
      pathname,
      router,
      selectedItems,
      selectionKind
    ]
  )

  return {
    onBatchAction,
    processing: isPending,
    confirmState,
    closeConfirm: () => setConfirmState(null),
    modalsProps
  }
}
