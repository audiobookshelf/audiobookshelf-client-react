import ServerStatusCard from './ServerStatusCard'
import { getServerStatus } from '@/lib/api'

export default async function StatusDataFetcher() {
  const statusData = await getServerStatus()

  return <ServerStatusCard statusData={statusData} />
}
