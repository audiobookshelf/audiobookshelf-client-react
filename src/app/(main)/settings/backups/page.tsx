import { getBackups, getCurrentUser, getData } from '@/lib/api'
import { updateServerSettings } from '../actions'
import BackupsClient from './BackupsClient'

export const dynamic = 'force-dynamic'

export default async function BackupsPage() {
  const [backupsResponse, currentUser] = await getData(getBackups(), getCurrentUser())

  if (!backupsResponse) {
    return <div>Error loading backups</div>
  }

  return <BackupsClient backupResponse={backupsResponse} currentUser={currentUser} updateServerSettings={updateServerSettings} />
}
