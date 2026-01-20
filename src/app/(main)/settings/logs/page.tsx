import { getData, getLoggerData } from '@/lib/api'
import LogsClient from './LogsClient'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const [loggerDataResponse] = await getData(getLoggerData())
  const currentDailyLogs = loggerDataResponse?.currentDailyLogs || []

  return <LogsClient currentDailyLogs={currentDailyLogs} />
}
