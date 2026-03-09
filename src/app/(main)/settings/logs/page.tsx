import { getCurrentUser, getData, getLoggerData } from '@/lib/api'
import { updateServerSettings } from '../actions'
import LogsClient from './LogsClient'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const [[loggerDataResponse], [currentUser]] = await Promise.all([getData(getLoggerData()), getData(getCurrentUser())])
  const currentDailyLogs = loggerDataResponse?.currentDailyLogs || []
  const logLevel = currentUser?.serverSettings?.logLevel

  return <LogsClient currentDailyLogs={currentDailyLogs} logLevel={logLevel} updateServerSettings={updateServerSettings} />
}
