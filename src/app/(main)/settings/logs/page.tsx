import { getCurrentUser, getData, getLoggerData } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import LogsClient from './LogsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsLogs')
}

export default async function LogsPage() {
  const [[loggerDataResponse], [currentUser]] = await Promise.all([getData(getLoggerData()), getData(getCurrentUser())])
  const currentDailyLogs = loggerDataResponse?.currentDailyLogs || []
  const logLevel = currentUser?.serverSettings?.logLevel

  return <LogsClient currentDailyLogs={currentDailyLogs} logLevel={logLevel} />
}
