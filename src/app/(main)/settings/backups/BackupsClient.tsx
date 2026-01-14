'use client'

import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetBackupsResponse, ServerSettings, UserLoginResponse } from '@/types/api'
import { useState, useTransition } from 'react'
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
        <BackupLocation backupLocation={backupResponse.backupLocation} />

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
          </div>
        </div>

        {/* backups */}
        {backups.map((backup) => (
          <div key={backup.id}>{backup.datePretty}</div>
        ))}
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
