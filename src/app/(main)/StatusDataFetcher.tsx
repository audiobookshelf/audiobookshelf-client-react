import { getServerStatus } from '@/lib/api'
import ServerStatusCard from './ServerStatusCard'

export default async function StatusDataFetcher() {
  const statusData = await getServerStatus()

  return <ServerStatusCard statusData={statusData} />
}
