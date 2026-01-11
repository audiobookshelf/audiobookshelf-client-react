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
    <SettingsContent
      title={t('HeaderBackups')}
      description={t.rich('MessageBackupsDescription', {
        code: (chunks) => <code className="bg-foreground/10 text-foreground px-1 py-0.5 rounded-md">{chunks}</code>,
        strong: (chunks) => <strong className="font-bold text-foreground">{chunks}</strong>
      })}
    >
      <div>
        {backups.map((backup) => (
          <div key={backup.id}>{backup.datePretty}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
