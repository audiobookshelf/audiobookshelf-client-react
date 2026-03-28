import ListeningSessionsClient from '@/app/(main)/settings/listening-sessions/ListeningSessionsClient'
import { getData, getListeningSessions, getOpenListeningSessions, getUsers } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function ListeningSessionsPage() {
  const [usersResponse, sessionsResponse, openSessionsResponse] = await getData(
    getUsers(),
    getListeningSessions('page=0&itemsPerPage=10&sort=updatedAt&desc=1'),
    getOpenListeningSessions()
  )

  const users = usersResponse?.users || []

  return <ListeningSessionsClient users={users} sessionsResponse={sessionsResponse} openSessionsResponse={openSessionsResponse} />
}
