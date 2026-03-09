'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LoggerDataLog, ServerSettings } from '@/types/api'
import type { UpdateServerSettingsApiResponse } from '../actions'
import SettingsContent from '../SettingsContent'
import LogsContainer from './LogsContainer'

interface LogsClientProps {
  currentDailyLogs: LoggerDataLog[]
  logLevel?: number
  updateServerSettings: (settingsUpdatePayload: Partial<ServerSettings>) => Promise<UpdateServerSettingsApiResponse>
}

export default function LogsClient({ currentDailyLogs, logLevel, updateServerSettings }: LogsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderLogs')} moreInfoUrl="https://www.audiobookshelf.org/guides/server_logs">
      <div className="py-4">
        <LogsContainer currentDailyLogs={currentDailyLogs} logLevel={logLevel} updateServerSettings={updateServerSettings} />
      </div>
    </SettingsContent>
  )
}
