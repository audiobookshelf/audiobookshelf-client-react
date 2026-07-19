import ListeningSessionsClient from '@/app/(main)/settings/listening-sessions/ListeningSessionsClient'
import { getData, getListeningSessions, getOpenListeningSessions, getUser, getUsers } from '@/lib/api'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface ListeningSessionsPageProps {
  searchParams: Promise<{ user?: string }>
}

export default async function ListeningSessionsPage({ searchParams }: ListeningSessionsPageProps) {
  const { user: userFilter } = await searchParams

  const baseQuery = 'page=0&itemsPerPage=10&sort=updatedAt&desc=1'
  const sessionsQuery = userFilter ? `${baseQuery}&user=${encodeURIComponent(userFilter)}` : baseQuery

  const openSessionsPromise = userFilter ? Promise.resolve({ sessions: [], shareSessions: [] }) : getOpenListeningSessions()

  const [usersResponse, sessionsResponse, openSessionsResponse, filteredUser] = await getData(
    getUsers(),
    getListeningSessions(sessionsQuery),
    openSessionsPromise,
    userFilter ? getUser(userFilter) : Promise.resolve(null)
  )

  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

  if (userFilter && !filteredUser) {
    redirect('/settings/users')
  }

  return (
    <ListeningSessionsClient
      users={users}
      sessionsResponse={sessionsResponse}
      openSessionsResponse={openSessionsResponse}
      userFilter={userFilter}
      filteredUser={filteredUser}
    />
  )
}
