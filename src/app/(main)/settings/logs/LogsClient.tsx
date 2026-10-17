'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LoggerDataLog } from '@/types/api'
import SettingsContent from '../SettingsContent'
import { SETTINGS_MORE_INFO_URLS } from '../settingsNavItems'
import LogsContainer from './LogsContainer'

interface LogsClientProps {
  currentDailyLogs: LoggerDataLog[]
  logLevel?: number
}

export default function LogsClient({ currentDailyLogs, logLevel }: LogsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent
      title={t('HeaderLogs')}
      moreInfoUrl={SETTINGS_MORE_INFO_URLS.logs}
      description={t.rich('MessageLogsDescription', {
        code: (chunks) => <code className="bg-foreground/10 text-foreground rounded-md px-1 py-0.5">{chunks}</code>
      })}
    >
      <div className="py-4">
        <LogsContainer currentDailyLogs={currentDailyLogs} logLevel={logLevel} />
      </div>
    </SettingsContent>
  )
}
