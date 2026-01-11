import { getBackups, getData } from '@/lib/api'
import BackupsClient from './BackupsClient'

export const dynamic = 'force-dynamic'

export default async function BackupsPage() {
  const [backupsResponse] = await getData(getBackups())
  const backups = backupsResponse?.backups || []

  return <BackupsClient backups={backups} />
}
