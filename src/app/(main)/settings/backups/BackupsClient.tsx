'use client'

import { getCookie } from '@/app/(main)/upload/actions'
import { uploadBackupArchive } from '@/app/(main)/upload/UploadHelper'
import Btn from '@/components/ui/Btn'
import FileInput from '@/components/ui/FileInput'
import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable, { DataTableColumn } from '@/components/ui/SimpleDataTable'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime } from '@/lib/datefns'
import { downloadBackup } from '@/lib/download'
import { bytesPretty } from '@/lib/string'
import { Backup, GetBackupsResponse, ServerSettings } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { UpdateServerSettingsApiResponse } from '../actions'
import SettingsContent from '../SettingsContent'
import SettingsToggleSwitch from '../SettingsToggleSwitch'
import { createBackup, deleteBackup } from './actions'
import BackupLocation from './BackupLocation'
import BackupScheduleModal from './BackupScheduleModal'

interface BackupsClientProps {
  backupResponse: GetBackupsResponse
  updateServerSettings: (settingsUpdatePayload: Partial<ServerSettings>) => Promise<UpdateServerSettingsApiResponse>
}

export default function BackupsClient({ backupResponse, updateServerSettings }: BackupsClientProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [previousCronExpress, setPreviousCronExpress] = useState<string | false>()
  const [isBackupScheduleModalOpen, setIsBackupScheduleModalOpen] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isUploadingBackup, setIsUploadingBackup] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null)
  const backupPendingDeleteRef = useRef<Backup | null>(null)
  const { showToast } = useGlobalToast()
  const { serverSettings } = useUser()

  const backups = backupResponse.backups
  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const [backupsToKeep, setBackupsToKeep] = useState(serverSettings.backupsToKeep ? String(serverSettings.backupsToKeep) : '')
  const [maxBackupSize, setMaxBackupSize] = useState(serverSettings.maxBackupSize ? String(serverSettings.maxBackupSize) : '')

  const backupSchedule = serverSettings.backupSchedule // cron expression or false if disabled

  const handleUpdateBackupSettings = (settingsUpdatePayload: Partial<ServerSettings>) => {
    if (isPending) return

    // Store the previous cron expression to allow toggling back to the previous schedule
    if (!settingsUpdatePayload.backupSchedule && backupSchedule) {
      setPreviousCronExpress(backupSchedule)
    }

    startTransition(async () => {
      const response = await updateServerSettings(settingsUpdatePayload)
      if (!response?.serverSettings) {
        console.error('Failed to update server settings')
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      } else {
        setIsBackupScheduleModalOpen(false)
      }
    })
  }

  const handleAutoBackupsChanged = (value: boolean) => {
    // default schedule to run at 1:30 AM every day
    const newBackupSchedule = value ? previousCronExpress || '30 1 * * *' : false
    handleUpdateBackupSettings({ backupSchedule: newBackupSchedule })
  }

  const handleBackupsToKeepBlur = () => {
    const newValue = parseInt(backupsToKeep)
    if (isNaN(newValue) || newValue < 1 || newValue > 99) {
      showToast(t('ToastBackupInvalidMaxKeep'), { type: 'error' })
      setBackupsToKeep(String(serverSettings.backupsToKeep))
      return
    }
    handleUpdateBackupSettings({ backupsToKeep: newValue })
  }

  const handleMaxBackupSizeBlur = () => {
    const newValue = parseInt(maxBackupSize)
    if (isNaN(newValue) || newValue < 0) {
      showToast(t('ToastBackupInvalidMaxSize'), { type: 'error' })
      setMaxBackupSize(String(serverSettings.maxBackupSize))
      return
    }
    handleUpdateBackupSettings({ maxBackupSize: newValue })
  }

  const handleUpdateBackupSchedule = (cronExpression: string) => {
    handleUpdateBackupSettings({ backupSchedule: cronExpression })
  }

  const handleUploadBackup = useCallback(
    async (file: File) => {
      if (isUploadingBackup || isCreatingBackup) return

      setIsUploadingBackup(true)
      try {
        const accessToken = await getCookie()
        if (!accessToken) {
          showToast(t('ToastBackupUploadFailed'), { type: 'error' })
          return
        }

        await uploadBackupArchive(file, accessToken)

        showToast(t('ToastBackupUploadSuccess'), { type: 'success' })
        router.refresh()
      } catch (error) {
        console.error('Failed to upload backup', error)
        const message = error instanceof Error && error.message.trim() ? error.message : t('ToastBackupUploadFailed')
        showToast(message, { type: 'error' })
      } finally {
        setIsUploadingBackup(false)
      }
    },
    [isUploadingBackup, isCreatingBackup, showToast, t, router]
  )

  const handleCreateBackup = useCallback(async () => {
    if (isCreatingBackup || isUploadingBackup) return

    setIsCreatingBackup(true)
    try {
      await createBackup()
      showToast(t('ToastBackupCreateSuccess'), { type: 'success' })
      router.refresh()
    } catch (error) {
      console.error('Failed to create backup', error)
      showToast(t('ToastBackupCreateFailed'), { type: 'error' })
    } finally {
      setIsCreatingBackup(false)
    }
  }, [isCreatingBackup, isUploadingBackup, showToast, t, router])

  const handleDownloadBackup = useCallback((backup: Backup) => {
    downloadBackup(backup.id, backup.filename)
  }, [])

  const handleDeleteBackupClick = useCallback((backup: Backup) => {
    backupPendingDeleteRef.current = backup
    setShowDeleteConfirmDialog(true)
  }, [])

  const handleConfirmDeleteBackup = useCallback(async () => {
    if (!backupPendingDeleteRef.current) return
    setShowDeleteConfirmDialog(false)

    const backupToDelete = backupPendingDeleteRef.current
    setDeletingBackupId(backupToDelete.id)

    try {
      await deleteBackup(backupToDelete.id)
      showToast(t('ToastBackupDeleteSuccess'), { type: 'success' })
      router.refresh()
    } catch (error) {
      console.error('Failed to delete backup', error)
      showToast(t('ToastBackupDeleteFailed'), { type: 'error' })
    } finally {
      setDeletingBackupId(null)
      backupPendingDeleteRef.current = null
    }
  }, [showToast, t, router])

  return (
    <SettingsContent
      title={t('HeaderBackups')}
      description={t.rich('MessageBackupsDescription', {
        code: (chunks) => <code className="bg-foreground/10 text-foreground rounded-md px-1 py-0.5">{chunks}</code>,
        strong: (chunks) => <strong className="text-foreground font-bold">{chunks}</strong>
      })}
    >
      <div>
        {/* backup location */}
        <BackupLocation backupLocation={backupResponse.backupLocation} backupPathEnvSet={backupResponse.backupPathEnvSet} />

        <div className="mb-4 -ml-2">
          <SettingsToggleSwitch
            label={t('LabelBackupsEnableAutomaticBackups')}
            value={!!backupSchedule}
            onChange={handleAutoBackupsChanged}
            tooltip={t('LabelBackupsEnableAutomaticBackupsHelp')}
          />
          {!!backupSchedule && (
            <div className="pl-6">
              <div className="flex gap-2">
                <div>
                  <CronExpressionPreview cronExpression={backupSchedule as string} />
                </div>
                <div>
                  <IconBtn
                    ariaLabel={t('LabelEdit')}
                    borderless
                    size="small"
                    className="text-foreground-muted cursor-pointer"
                    onClick={() => setIsBackupScheduleModalOpen(true)}
                  >
                    edit
                  </IconBtn>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TextInput
              value={backupsToKeep}
              onChange={setBackupsToKeep}
              type="number"
              min="1"
              id="backups-to-keep"
              className="w-16"
              onBlur={handleBackupsToKeepBlur}
              disabled={isPending}
            />
            <label htmlFor="backups-to-keep-input">{t('LabelBackupsNumberToKeep')}</label>
            <Tooltip text={t('LabelBackupsNumberToKeepHelp')} maxWidth={300}>
              <span className="material-symbols text-lg" aria-hidden="true">
                info
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <TextInput
              value={maxBackupSize}
              onChange={setMaxBackupSize}
              type="number"
              min="0"
              id="max-backup-size"
              className="w-16"
              onBlur={handleMaxBackupSizeBlur}
              disabled={isPending}
            />
            <label htmlFor="max-backup-size-input">{t('LabelBackupsMaxBackupSize')}</label>
            <Tooltip text={t('LabelBackupsMaxBackupSizeHelp')} maxWidth={300}>
              <span className="material-symbols text-lg" aria-hidden="true">
                info
              </span>
            </Tooltip>
          </div>
        </div>

        <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-2">
          <FileInput
            accept=".audiobookshelf"
            ariaLabel={t('ButtonUploadBackup')}
            onChange={(file) => void handleUploadBackup(file)}
            className={isUploadingBackup || isCreatingBackup ? 'pointer-events-none opacity-50' : ''}
          >
            {t('ButtonUploadBackup')}
          </FileInput>
          <Btn loading={isCreatingBackup} disabled={isCreatingBackup || isUploadingBackup} onClick={() => void handleCreateBackup()}>
            {t('ButtonCreateBackup')}
          </Btn>
        </div>

        {/* backups table */}
        <div className="relative">
          {backups.length > 0 ? (
            <BackupsTable
              backups={backups}
              dateFormat={dateFormat}
              timeFormat={timeFormat}
              onDownload={handleDownloadBackup}
              onDelete={handleDeleteBackupClick}
              deletingBackupId={deletingBackupId}
            />
          ) : (
            <p className="text-foreground py-4 text-center text-lg">{t('MessageNoBackups')}</p>
          )}
          {isUploadingBackup && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/25" aria-busy="true" aria-live="polite">
              <LoadingSpinner size="la-lg" />
            </div>
          )}
        </div>
      </div>
      <BackupScheduleModal
        isOpen={isBackupScheduleModalOpen}
        isPending={isPending}
        onClose={() => setIsBackupScheduleModalOpen(false)}
        cronExpression={backupSchedule || ''}
        onUpdate={handleUpdateBackupSchedule}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        message={t('MessageConfirmDeleteBackup', {
          0: backupPendingDeleteRef.current ? formatJsDatetime(new Date(backupPendingDeleteRef.current.createdAt), dateFormat, timeFormat) : ''
        })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => {
          backupPendingDeleteRef.current = null
          setShowDeleteConfirmDialog(false)
        }}
        onConfirm={() => void handleConfirmDeleteBackup()}
      />
    </SettingsContent>
  )
}

interface BackupsTableProps {
  backups: Backup[]
  dateFormat: string
  timeFormat: string
  onRestore?: (backup: Backup) => void
  onDownload?: (backup: Backup) => void
  onDelete?: (backup: Backup) => void
  deletingBackupId?: string | null
}

function BackupsTable({ backups, dateFormat, timeFormat, onRestore, onDownload, onDelete, deletingBackupId }: BackupsTableProps) {
  const t = useTypeSafeTranslations()

  const columns: DataTableColumn<Backup>[] = useMemo(
    () => [
      {
        label: t('LabelFile'),
        accessor: (backup) => `/backups/${backup.filename}`
      },
      {
        label: t('LabelDatetime'),
        accessor: (backup) => formatJsDatetime(new Date(backup.createdAt), dateFormat, timeFormat)
      },
      {
        label: t('LabelSize'),
        accessor: (backup) => bytesPretty(backup.fileSize),
        cellClassName: 'font-mono'
      },
      {
        label: '',
        accessor: (backup) => (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Btn size="small" onClick={() => onRestore?.(backup)}>
              {t('ButtonRestore')}
            </Btn>
            <IconBtn ariaLabel={t('LabelDownload')} borderless size="small" onClick={() => onDownload?.(backup)}>
              download
            </IconBtn>
            <IconBtn
              ariaLabel={t('ButtonDelete')}
              borderless
              size="small"
              className="hover:not-disabled:text-error"
              loading={deletingBackupId === backup.id}
              onClick={() => onDelete?.(backup)}
            >
              delete
            </IconBtn>
          </div>
        ),
        headerClassName: 'w-48',
        cellClassName: 'text-right'
      }
    ],
    [t, onRestore, onDownload, onDelete, deletingBackupId, dateFormat, timeFormat]
  )

  return <SimpleDataTable data={backups} columns={columns} getRowKey={(backup) => backup.id} caption={t('HeaderBackups')} />
}
