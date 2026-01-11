'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { GetBackupsResponse } from '@/types/api'
import SettingsContent from '../SettingsContent'

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
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols text-xl text-foreground-subdued" aria-hidden="true">
              folder
            </span>
            <p className="text-foreground-subdued uppercase text-sm whitespace-nowrap">{t('LabelBackupLocation')}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-base text-foreground break-all">{backupResponse.backupLocation}</p>
            <IconBtn
              ariaLabel={t('LabelEdit')}
              borderless
              size="small"
              className="text-foreground-muted cursor-pointer"
              onClick={() => {
                console.log('Not implemented yet')
              }}
            >
              edit
            </IconBtn>
          </div>
        </div>

        {/* backups */}
        {backups.map((backup) => (
          <div key={backup.id}>{backup.datePretty}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
