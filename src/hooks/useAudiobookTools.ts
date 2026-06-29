'use client'

import { cancelM4bEncodeAction, embedMetadataAction, encodeM4bAction, getMetadataObjectAction } from '@/app/actions/toolsActions'
import type { ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useSocketEvent } from '@/contexts/SocketContext'
import { useTasks } from '@/contexts/TasksContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookLibraryItem, M4bEncodeOptions, PodcastLibraryItem } from '@/types/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

export type AudiobookTool = 'embed' | 'm4b'

function readBackupPreference(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem('embedMetadataShouldBackup')
  return stored !== '0'
}

interface UseAudiobookToolsOptions {
  initialLibraryItem: BookLibraryItem
}

export function useAudiobookTools({ initialLibraryItem }: UseAudiobookToolsOptions) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()

  const [libraryItem, setLibraryItem] = useState(initialLibraryItem)
  const [metadataObject, setMetadataObject] = useState<Record<string, string> | null>(null)
  const [shouldBackupAudioFiles, setShouldBackupAudioFiles] = useState(readBackupPreference)
  const [processing, setProcessing] = useState(false)
  const [isCancelingEncode, setIsCancelingEncode] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [encodingOptions, setEncodingOptions] = useState<M4bEncodeOptions>({
    bitrate: '128k',
    channels: '2',
    codec: 'aac'
  })

  const { queuedEmbedLIds, getTasksByLibraryItemId, getTaskProgress, getAudioFilesEncoding, getAudioFilesFinished } = useTasks()

  const libraryItemId = libraryItem.id
  const itemPath = `/library/${libraryItem.libraryId}/item/${libraryItemId}`
  const toolsBasePath = `${itemPath}/tools`

  const selectedTool: AudiobookTool = searchParams.get('tool') === 'm4b' ? 'm4b' : 'embed'
  const isEmbedTool = selectedTool === 'embed'
  const isM4BTool = selectedTool === 'm4b'

  const media = libraryItem.media
  const mediaMetadata = media.metadata
  const tracks = useMemo(() => media.tracks ?? [], [media.tracks])
  const metadataChapters = media.chapters || []

  const itemTasks = useMemo(() => getTasksByLibraryItemId(libraryItemId), [getTasksByLibraryItemId, libraryItemId])
  const embedTask = useMemo(() => itemTasks.find((task) => task.action === 'embed-metadata'), [itemTasks])
  const encodeTask = useMemo(() => itemTasks.find((task) => task.action === 'encode-m4b'), [itemTasks])
  const task = isEmbedTool ? embedTask : isM4BTool ? encodeTask : undefined

  const isTaskFinished = !!task?.isFinished
  const taskFailed = isTaskFinished && !!task?.isFailed
  const taskError = taskFailed ? task?.error || 'Unknown Error' : null
  const progress = getTaskProgress(libraryItemId) || '0%'
  const audioFilesEncoding = getAudioFilesEncoding(libraryItemId) || {}
  const audioFilesFinished = getAudioFilesFinished(libraryItemId) || {}
  const isMetadataEmbedQueued = queuedEmbedLIds.includes(libraryItemId)

  const encodeTaskHasEncodingOptions = useMemo(() => {
    if (!isM4BTool || !encodeTask?.data?.encodeOptions) return false
    return Object.keys(encodeTask.data.encodeOptions).length > 0
  }, [encodeTask, isM4BTool])

  const fetchMetadataObject = useCallback(async () => {
    try {
      const result = await getMetadataObjectAction(libraryItemId)
      setMetadataObject(result)
    } catch (error) {
      console.error('Failed to fetch metadata object', error)
    }
  }, [libraryItemId])

  useEffect(() => {
    void fetchMetadataObject()
  }, [fetchMetadataObject])

  useEffect(() => {
    if (task) {
      setProcessing(!task.isFinished)
    }
  }, [task])

  useEffect(() => {
    if (!encodeTaskHasEncodingOptions || !encodeTask?.data?.encodeOptions) return
    const options = encodeTask.data.encodeOptions
    setEncodingOptions({
      bitrate: options.bitrate || '128k',
      channels: options.channels ?? '2',
      codec: options.codec || 'aac'
    })
  }, [encodeTask, encodeTaskHasEncodingOptions])

  const handleItemUpdated = useCallback(
    (updatedItem: BookLibraryItem | PodcastLibraryItem) => {
      if (updatedItem.id === libraryItemId && updatedItem.mediaType === 'book') {
        setLibraryItem(updatedItem)
        void fetchMetadataObject()
      }
    },
    [fetchMetadataObject, libraryItemId]
  )

  useSocketEvent<BookLibraryItem | PodcastLibraryItem>('item_updated', handleItemUpdated, [handleItemUpdated])

  const setSelectedTool = useCallback(
    (tool: AudiobookTool) => {
      router.replace(`${toolsBasePath}?tool=${tool}`)
    },
    [toolsBasePath, router]
  )

  const toggleBackupAudioFiles = useCallback((value: boolean) => {
    setShouldBackupAudioFiles(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('embedMetadataShouldBackup', value ? '1' : '0')
    }
  }, [])

  const handleEncodingOptionsChange = useCallback((options: M4bEncodeOptions) => {
    setEncodingOptions(options)
  }, [])

  const startEmbedMetadata = useCallback(() => {
    startTransition(async () => {
      try {
        setProcessing(true)
        await embedMetadataAction(libraryItemId, shouldBackupAudioFiles)
      } catch (error) {
        console.error('Audio metadata embed failed', error)
        setProcessing(false)
      }
    })
  }, [libraryItemId, shouldBackupAudioFiles])

  const handleEmbedClick = useCallback(() => {
    setConfirmState({
      isOpen: true,
      message: t('MessageConfirmEmbedMetadataInAudioFiles', { 0: tracks.length }),
      yesButtonText: t('ButtonYes'),
      yesButtonClassName: 'bg-primary',
      onConfirm: () => {
        setConfirmState(null)
        startEmbedMetadata()
      }
    })
  }, [tracks.length, startEmbedMetadata, t])

  const handleEncodeM4bClick = useCallback(() => {
    startTransition(async () => {
      try {
        setProcessing(true)
        await encodeM4bAction(libraryItemId, encodingOptions)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown Error'
        showToast(errorMsg, { type: 'error' })
        setProcessing(false)
      }
    })
  }, [encodingOptions, libraryItemId, showToast])

  const handleCancelEncodeClick = useCallback(() => {
    setIsCancelingEncode(true)
    startTransition(async () => {
      try {
        await cancelM4bEncodeAction(libraryItemId)
        showToast(t('ToastEncodeCancelSucces'), { type: 'success' })
      } catch (error) {
        console.error('Failed to cancel encode', error)
        showToast(t('ToastEncodeCancelFailed'), { type: 'error' })
      } finally {
        setIsCancelingEncode(false)
      }
    })
  }, [libraryItemId, showToast, t])

  const handleLibraryItemSaved = useCallback(
    (updatedItem: BookLibraryItem | PodcastLibraryItem) => {
      if (updatedItem.mediaType !== 'book') return
      setLibraryItem(updatedItem)
      void fetchMetadataObject()
      setIsEditModalOpen(false)
    },
    [fetchMetadataObject]
  )

  const toolDropdownItems = useMemo(
    () => [
      { text: t('LabelToolsEmbedMetadata'), value: 'embed' as const },
      { text: t('LabelToolsM4bEncoder'), value: 'm4b' as const }
    ],
    [t]
  )

  return {
    libraryItem,
    itemPath,
    title: mediaMetadata.title ?? '',
    libraryItemRelPath: libraryItem.relPath,
    mediaMetadata,
    tracks,
    metadataChapters,
    metadataObject,
    selectedTool,
    isEmbedTool,
    isM4BTool,
    toolDropdownItems,
    setSelectedTool,
    shouldBackupAudioFiles,
    toggleBackupAudioFiles,
    processing: processing || isPending,
    isCancelingEncode,
    progress,
    isTaskFinished,
    taskFailed,
    taskError,
    isMetadataEmbedQueued,
    queuedEmbedCount: queuedEmbedLIds.length,
    encodeTaskHasEncodingOptions,
    encodingOptions,
    handleEncodingOptionsChange,
    audioFilesEncoding,
    audioFilesFinished,
    confirmState,
    setConfirmState,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEmbedClick,
    handleEncodeM4bClick,
    handleCancelEncodeClick,
    handleLibraryItemSaved
  }
}
