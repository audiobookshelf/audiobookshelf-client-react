'use client'

import Btn from '@/components/ui/Btn'
import DataTable, { DataTableColumn } from '@/components/ui/DataTable'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime } from '@/lib/datefns'
import { bytesPretty } from '@/lib/string'
import { Backup, GetBackupsResponse, ServerSettings, UserLoginResponse } from '@/types/api'
import { useMemo, useState, useTransition } from 'react'
import { UpdateServerSettingsApiResponse } from '../actions'
import SettingsContent from '../SettingsContent'
import SettingsToggleSwitch from '../SettingsToggleSwitch'
import BackupLocation from './BackupLocation'
import BackupScheduleModal from './BackupScheduleModal'

interface BackupsClientProps {
  backupResponse: GetBackupsResponse
  currentUser: UserLoginResponse
  updateServerSettings: (settingsUpdatePayload: Partial<ServerSettings>) => Promise<UpdateServerSettingsApiResponse>
}

export default function BackupsClient({ backupResponse, currentUser, updateServerSettings }: BackupsClientProps) {
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()
  const [previousCronExpress, setPreviousCronExpress] = useState<string | false>()
  const [isBackupScheduleModalOpen, setIsBackupScheduleModalOpen] = useState(false)
  const { showToast } = useGlobalToast()

  const backups = backupResponse.backups
  const serverSettings = currentUser.serverSettings
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

  return (
    <SettingsContent
      title={t('HeaderBackups')}
      description={t.rich('MessageBackupsDescription', {
        code: (chunks) => <code className="bg-foreground/10 text-foreground px-1 py-0.5 rounded-md">{chunks}</code>,
        strong: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>
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

        <div className="mb-4 mt-8 flex justify-between">
          <Btn onClick={() => {}}>
            {t('ButtonUploadBackup')}
          </Btn>
          <Btn onClick={() => {}}>
            {t('ButtonCreateBackup')}
          </Btn>
        </div>

        {/* backups table */}
        <BackupsTable backups={backups} dateFormat={dateFormat} timeFormat={timeFormat} />
      </div>
      <BackupScheduleModal
        isOpen={isBackupScheduleModalOpen}
        isPending={isPending}
        onClose={() => setIsBackupScheduleModalOpen(false)}
        cronExpression={backupSchedule || ''}
        onUpdate={handleUpdateBackupSchedule}
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
}

function BackupsTable({ backups, dateFormat, timeFormat, onRestore, onDownload, onDelete }: BackupsTableProps) {
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
          <div className="flex items-center justify-end gap-2">
            <Btn size="small" onClick={() => onRestore?.(backup)}>
              {t('ButtonRestore')}
            </Btn>
            <IconBtn ariaLabel={t('LabelDownload')} borderless size="small" onClick={() => onDownload?.(backup)}>
              download
            </IconBtn>
            <IconBtn ariaLabel={t('ButtonDelete')} borderless size="small" className="hover:not-disabled:text-error" onClick={() => onDelete?.(backup)}>
              delete
            </IconBtn>
          </div>
        ),
        headerClassName: 'w-48',
        cellClassName: 'text-right'
      }
    ],
    [t, onRestore, onDownload, onDelete, dateFormat, timeFormat]
  )

  return <DataTable data={backups} columns={columns} getRowKey={(backup) => backup.id} caption={t('HeaderBackups')} />
}
