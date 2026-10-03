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
    <SettingsContent title={t('HeaderLogs')} moreInfoUrl={SETTINGS_MORE_INFO_URLS.logs}>
      <div className="py-4">
        <LogsContainer currentDailyLogs={currentDailyLogs} logLevel={logLevel} />
      </div>
    </SettingsContent>
  )
}
