'use client'

import { embedMetadataAction } from '@/app/actions/toolsActions'
import Btn from '@/components/ui/Btn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTasks } from '@/contexts/TasksContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isBookMediaWithTracks, type BookLibraryItem, type PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

const BACKUP_STORAGE_KEY = 'embedMetadataShouldBackup'

function readShouldBackupAudioFiles(): boolean {
  try {
    const stored = localStorage.getItem(BACKUP_STORAGE_KEY)
    if (stored === null) return true
    return stored !== '0'
  } catch {
    return true
  }
}

function persistShouldBackupAudioFiles(value: boolean) {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

interface EmbedMetadataFooterControlProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem | null | undefined
}

export default function EmbedMetadataFooterControl({ libraryItem }: EmbedMetadataFooterControlProps) {
  const t = useTypeSafeTranslations()
  const { userIsAdminOrUp } = useUser()
  const { queuedEmbedLIds, getTasksByLibraryItemId, getTaskProgress } = useTasks()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [shouldBackupAudioFiles, setShouldBackupAudioFiles] = useState(true)

  useEffect(() => {
    setShouldBackupAudioFiles(readShouldBackupAudioFiles())
  }, [])

  const canEmbed = !!libraryItem && libraryItem.mediaType === 'book' && isBookMediaWithTracks(libraryItem.media) && userIsAdminOrUp

  const libraryItemId = libraryItem?.id
  const itemTasks = useMemo(() => (libraryItemId ? getTasksByLibraryItemId(libraryItemId) : []), [getTasksByLibraryItemId, libraryItemId])
  const embedTask = useMemo(() => itemTasks.find((task) => task.action === 'embed-metadata'), [itemTasks])
  const isMetadataEmbedQueued = !!libraryItemId && queuedEmbedLIds.includes(libraryItemId)
  const isEmbedTaskRunning = !!embedTask && !embedTask.isFinished
  const progress = libraryItemId ? getTaskProgress(libraryItemId) || '0%' : '0%'
  const isBusy = isPending || isMetadataEmbedQueued || isEmbedTaskRunning

  const trackCount = useMemo(() => {
    if (!libraryItem || libraryItem.mediaType !== 'book') return 0
    return libraryItem.media.tracks?.length || libraryItem.media.numTracks || 0
  }, [libraryItem])

  const handleClick = useCallback(() => {
    if (isBusy) return
    setShouldBackupAudioFiles(readShouldBackupAudioFiles())
    setShowConfirm(true)
  }, [isBusy])

  const handleConfirmClose = useCallback(() => {
    setShowConfirm(false)
  }, [])

  const handleConfirm = useCallback(
    (checkboxValue?: boolean) => {
      if (!libraryItemId) return
      const backup = checkboxValue ?? shouldBackupAudioFiles
      setShouldBackupAudioFiles(backup)
      persistShouldBackupAudioFiles(backup)
      setShowConfirm(false)
      startTransition(async () => {
        try {
          await embedMetadataAction(libraryItemId, backup)
        } catch (error) {
          console.error('Audio metadata embed failed', error)
        }
      })
    },
    [libraryItemId, shouldBackupAudioFiles]
  )

  if (!canEmbed || !libraryItem) return null

  return (
    <div cy-id="embed-metadata-footer-control">
      <Btn disabled={isBusy} loading={isBusy} progress={isBusy && isEmbedTaskRunning ? progress : undefined} onClick={handleClick}>
        {t('ButtonEmbed')}
      </Btn>

      <ConfirmDialog
        isOpen={showConfirm}
        message={t('MessageConfirmEmbedMetadataInAudioFiles', { 0: trackCount })}
        checkboxLabel={t('LabelBackupAudioFiles')}
        checkboxDefaultValue={shouldBackupAudioFiles}
        yesButtonText={t('ButtonYes')}
        onClose={handleConfirmClose}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
