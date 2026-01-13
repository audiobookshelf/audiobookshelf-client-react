'use client'

import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetBackupsResponse, ServerSettings, UserLoginResponse } from '@/types/api'
import { useState, useTransition } from 'react'
import { UpdateServerSettingsApiResponse } from '../actions'
import SettingsContent from '../SettingsContent'
import SettingsToggleSwitch from '../SettingsToggleSwitch'
import BackupLocation from './BackupLocation'

interface BackupsClientProps {
  backupResponse: GetBackupsResponse
  currentUser: UserLoginResponse
  updateServerSettings: (serverSettings: ServerSettings) => Promise<UpdateServerSettingsApiResponse>
}

export default function BackupsClient({ backupResponse, currentUser, updateServerSettings }: BackupsClientProps) {
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()
  const [previousCronExpress, setPreviousCronExpress] = useState<string | false>()
  const { showToast } = useGlobalToast()

  const backups = backupResponse.backups
  const serverSettings = currentUser.serverSettings
  const backupSchedule = serverSettings.backupSchedule // cron expression or false if disabled

  const handleUpdateBackupSettings = (newAutoBackupsEnabled: boolean) => {
    if (isPending) return

    // Store the previous cron expression to allow toggling back to the previous schedule
    if (!newAutoBackupsEnabled && backupSchedule) {
      setPreviousCronExpress(backupSchedule)
    }

    startTransition(async () => {
      // default schedule to run at 1:30 AM every day
      const newBackupSchedule = newAutoBackupsEnabled ? previousCronExpress || '30 1 * * *' : false
      const response = await updateServerSettings({ ...serverSettings, backupSchedule: newBackupSchedule })
      if (!response?.serverSettings) {
        console.error('Failed to update server settings')
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
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
            onChange={handleUpdateBackupSettings}
            tooltip={t('LabelBackupsEnableAutomaticBackupsHelp')}
          />
          {!!backupSchedule && (
            <div className="pl-6">
              <CronExpressionPreview cronExpression={backupSchedule as string} />
            </div>
          )}
        </div>

        {/* backups */}
        {backups.map((backup) => (
          <div key={backup.id}>{backup.datePretty}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
