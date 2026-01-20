'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LoggerDataLog } from '@/types/api'
import SettingsContent from '../SettingsContent'
import LogsContainer from './LogsContainer'

interface LogsClientProps {
  currentDailyLogs: LoggerDataLog[]
}

export default function LogsClient({ currentDailyLogs }: LogsClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderLogs')} moreInfoUrl="https://www.audiobookshelf.org/guides/server_logs">
      <div className="py-4">
        <LogsContainer currentDailyLogs={currentDailyLogs} />
      </div>
    </SettingsContent>
  )
}
