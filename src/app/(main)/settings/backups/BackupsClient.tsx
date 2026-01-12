'use client'

import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetBackupsResponse, UserLoginResponse } from '@/types/api'
import SettingsContent from '../SettingsContent'
import SettingsToggleSwitch from '../SettingsToggleSwitch'
import BackupLocation from './BackupLocation'

interface BackupsClientProps {
  backupResponse: GetBackupsResponse
  currentUser: UserLoginResponse
}

export default function BackupsClient({ backupResponse, currentUser }: BackupsClientProps) {
  const t = useTypeSafeTranslations()
  const backups = backupResponse.backups
  const serverSettings = currentUser.serverSettings
  const autoBackupsEnabled = !!serverSettings.backupSchedule

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
            value={autoBackupsEnabled}
            onChange={() => {
              console.log('Not implemented yet')
            }}
            tooltip={t('LabelBackupsEnableAutomaticBackupsHelp')}
          />
          {autoBackupsEnabled && (
            <div className="pl-6">
              <CronExpressionPreview cronExpression={serverSettings.backupSchedule as string} />
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
