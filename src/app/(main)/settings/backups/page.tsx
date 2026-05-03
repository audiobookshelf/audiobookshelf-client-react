import { getBackups, getData } from '@/lib/api'
import { updateServerSettings } from '../actions'
import BackupsClient from './BackupsClient'

export const dynamic = 'force-dynamic'

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ backup?: string }> }) {
  const sp = await searchParams
  const [backupsResponse] = await getData(getBackups())

  if (!backupsResponse) {
    return <div>Error loading backups</div>
  }

  return <BackupsClient backupResponse={backupsResponse} updateServerSettings={updateServerSettings} appliedBackupToast={sp.backup === '1'} />
}
