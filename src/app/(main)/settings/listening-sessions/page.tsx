import ListeningSessionsClient from '@/app/(main)/settings/listening-sessions/ListeningSessionsClient'
import { getData, getListeningSessions, getOpenListeningSessions, getUsers } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface ListeningSessionsPageProps {
  searchParams: Promise<{ user?: string }>
}

export default async function ListeningSessionsPage({ searchParams }: ListeningSessionsPageProps) {
  const { user: userFilter } = await searchParams

  const baseQuery = 'page=0&itemsPerPage=10&sort=updatedAt&desc=1'
  const sessionsQuery = userFilter ? `${baseQuery}&user=${encodeURIComponent(userFilter)}` : baseQuery

  const [usersResponse, sessionsResponse, openSessionsResponse] = await getData(getUsers(), getListeningSessions(sessionsQuery), getOpenListeningSessions())

  const users = usersResponse?.users || []

  return <ListeningSessionsClient users={users} sessionsResponse={sessionsResponse} openSessionsResponse={openSessionsResponse} />
}
