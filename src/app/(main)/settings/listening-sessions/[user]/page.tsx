import ListeningSessionsClient from '@/app/(main)/settings/listening-sessions/ListeningSessionsClient'
import { getData, getListeningSessions, getUsers } from '@/lib/api'
import { getUserOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ user: string }> }): Promise<Metadata> {
  const { user: userId } = await params
  const [user] = await getData(getUserOrNotFound(userId))

  return namedPageMetadata(user.username, 'TitleSettingsListeningSessionsUser')
}

export default async function UserListeningSessionsPage({ params }: { params: Promise<{ user: string }> }) {
  const { user: userId } = await params

  const baseQuery = 'page=0&itemsPerPage=10&sort=updatedAt&desc=1'
  const sessionsQuery = `${baseQuery}&user=${encodeURIComponent(userId)}`

  const [usersResponse, sessionsResponse, filteredUser] = await getData(getUsers(), getListeningSessions(sessionsQuery), getUserOrNotFound(userId))

  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

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
