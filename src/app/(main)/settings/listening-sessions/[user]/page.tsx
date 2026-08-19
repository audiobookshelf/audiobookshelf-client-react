import ListeningSessionsClient from '@/app/(main)/settings/listening-sessions/ListeningSessionsClient'
import { getData, getListeningSessions, getUsers } from '@/lib/api'
import { getUserOrNotFound } from '@/lib/notFound'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function UserListeningSessionsPage({ params }: { params: Promise<{ user: string }> }) {
  const { user: userId } = await params

  const baseQuery = 'page=0&itemsPerPage=10&sort=updatedAt&desc=1'
  const sessionsQuery = `${baseQuery}&user=${encodeURIComponent(userId)}`

  const [usersResponse, sessionsResponse, filteredUser] = await getData(getUsers(), getListeningSessions(sessionsQuery), getUserOrNotFound(userId))

  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

  // `getUserOrNotFound` will call `notFound()` on a 404, so no manual redirect needed.

  return (
    <ListeningSessionsClient
      users={users}
      sessionsResponse={sessionsResponse}
      openSessionsResponse={{ sessions: [], shareSessions: [] }}
      userFilter={userId}
      filteredUser={filteredUser}
    />
  )
}
