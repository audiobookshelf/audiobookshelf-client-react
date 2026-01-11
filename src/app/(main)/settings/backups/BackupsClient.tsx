'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Backup } from '@/types/api'
import SettingsContent from '../SettingsContent'

interface BackupsClientProps {
  backups: Backup[]
}

export default function BackupsClient({ backups }: BackupsClientProps) {
  const t = useTypeSafeTranslations()

  return (
    <SettingsContent title={t('HeaderBackups')}>
      <div>
        {backups.map((backup) => (
          <div key={backup.id}>{backup.datePretty}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
