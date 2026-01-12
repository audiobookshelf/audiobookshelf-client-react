'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetBackupsResponse } from '@/types/api'
import SettingsContent from '../SettingsContent'
import BackupLocation from './BackupLocation'

interface BackupsClientProps {
  backupResponse: GetBackupsResponse
}

export default function BackupsClient({ backupResponse }: BackupsClientProps) {
  const t = useTypeSafeTranslations()
  const backups = backupResponse.backups

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

        {/* backups */}
        {backups.map((backup) => (
          <div key={backup.id}>{backup.datePretty}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
