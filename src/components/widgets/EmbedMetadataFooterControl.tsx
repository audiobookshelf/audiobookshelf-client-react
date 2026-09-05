'use client'

import { embedMetadataAction } from '@/app/actions/toolsActions'
import Btn from '@/components/ui/Btn'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTasks } from '@/contexts/TasksContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isBookMediaWithTracks, type BookLibraryItem, type PodcastLibraryItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

const BACKUP_STORAGE_KEY = 'embedMetadataShouldBackup'
const ACTION_STORAGE_KEY = 'embedMetadataFooterAction'

type EmbedFooterAction = 'embed' | 'openEmbedManager' | 'makeM4b'

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

function readSavedFooterAction(): EmbedFooterAction {
  try {
    const stored = localStorage.getItem(ACTION_STORAGE_KEY)
    if (stored === 'embed' || stored === 'openEmbedManager' || stored === 'makeM4b') return stored
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
  return 'embed'
}

function persistFooterAction(action: EmbedFooterAction) {
  try {
    localStorage.setItem(ACTION_STORAGE_KEY, action)
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

function isEmbedFooterAction(value: string | number): value is EmbedFooterAction {
  return value === 'embed' || value === 'openEmbedManager' || value === 'makeM4b'
}

function actionIcon(name: string) {
  return (
    <span className="material-symbols text-lg" aria-hidden>
      {name}
    </span>
  )
}

interface EmbedMetadataFooterControlProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem | null | undefined
  /** Close the host modal before navigating to the tools page. */
  onClose?: () => void
}

export default function EmbedMetadataFooterControl({ libraryItem, onClose }: EmbedMetadataFooterControlProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { userIsAdminOrUp } = useUser()
  const { queuedEmbedLIds, getTasksByLibraryItemId, getTaskProgress } = useTasks()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [shouldBackupAudioFiles, setShouldBackupAudioFiles] = useState(true)
  const [selectedAction, setSelectedAction] = useState<EmbedFooterAction>('embed')

  useEffect(() => {
    setShouldBackupAudioFiles(readShouldBackupAudioFiles())
    setSelectedAction(readSavedFooterAction())
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

  const actionOptions = useMemo(
    (): { id: EmbedFooterAction; icon: string; label: string; description: string }[] => [
      { id: 'embed', icon: 'sell', label: t('ButtonEmbed'), description: t('ButtonEmbedDescription') },
      { id: 'openEmbedManager', icon: 'launch', label: t('ButtonOpenEmbedManager'), description: t('ButtonOpenEmbedManagerDescription') },
      { id: 'makeM4b', icon: 'audio_file', label: t('LabelToolsMakeM4b'), description: t('ButtonMakeM4bDescription') }
    ],
    [t]
  )

  const dropdownItems = useMemo((): DropdownItem[] => {
    return actionOptions.map((option) => ({
      text: option.label,
      value: option.id,
      subtext: option.description,
      ariaLabel: option.label,
      leftIcon: actionIcon(option.icon)
    }))
  }, [actionOptions])

  const selectedOption = actionOptions.find((option) => option.id === selectedAction) ?? actionOptions[0]

  const toolsPath = libraryItem ? `/library/${libraryItem.libraryId}/item/${libraryItem.id}/tools` : ''

  const navigateToTools = useCallback(
    (tool: 'embed' | 'm4b') => {
      if (!toolsPath) return
      onClose?.()
      router.push(`${toolsPath}?tool=${tool}`)
    },
    [onClose, router, toolsPath]
  )

  const handleActionChange = useCallback((value: string | number) => {
    if (!isEmbedFooterAction(value)) return
    setSelectedAction(value)
    persistFooterAction(value)
  }, [])

  const handlePrimaryClick = useCallback(() => {
    if (selectedAction === 'embed') {
      if (isBusy) return
      setShouldBackupAudioFiles(readShouldBackupAudioFiles())
      setShowConfirm(true)
      return
    }
    if (selectedAction === 'openEmbedManager') {
      navigateToTools('embed')
      return
    }
    navigateToTools('m4b')
  }, [isBusy, navigateToTools, selectedAction])

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

  const showEmbedLoading = selectedAction === 'embed' && isBusy

  const primaryButton = (
    <Btn
      disabled={showEmbedLoading}
      loading={showEmbedLoading}
      progress={showEmbedLoading && isEmbedTaskRunning ? progress : undefined}
      onClick={handlePrimaryClick}
      ariaLabel={selectedOption.label}
      className="h-full rounded-none border-0 whitespace-nowrap shadow-none"
    >
      <span className="material-symbols me-1.5 text-lg leading-none" aria-hidden>
        {selectedOption.icon}
      </span>
      {selectedOption.label}
    </Btn>
  )

  return (
    <div cy-id="embed-metadata-footer-control">
      <div
        className="border-border inline-flex h-10 items-stretch overflow-hidden rounded-md border shadow-md"
        role="group"
        aria-label={t('AriaLabelEmbedMetadataActions')}
      >
        {primaryButton}
        <span className="w-px self-stretch bg-white/20" aria-hidden />
        <Dropdown
          value={selectedAction}
          items={dropdownItems}
          onChange={handleActionChange}
          icon="arrow_drop_down"
          iconClass="h-full w-10 rounded-none border-0 shadow-none"
          ariaLabel={t('AriaLabelSelectEmbedAction')}
          menuAlign="end"
          stackedSubtext
          usePortal
          className="h-full"
        />
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        message={t('MessageConfirmEmbedMetadataInAudioFiles', { 0: trackCount })}
        checkboxLabel={t('LabelBackupAudioFiles')}
        checkboxDefaultValue={shouldBackupAudioFiles}
        yesButtonText={t('ButtonYes')}
        yesButtonClassName="bg-primary"
        onClose={handleConfirmClose}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
