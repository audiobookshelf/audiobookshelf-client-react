import ListeningSessionsClient from '@/app/(main)/settings/listening-sessions/ListeningSessionsClient'
import { getData, getListeningSessions, getOpenListeningSessions, getUsers } from '@/lib/api'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface ListeningSessionsPageProps {
  searchParams: Promise<{ user?: string }>
}

export default async function ListeningSessionsPage({ searchParams }: ListeningSessionsPageProps) {
  const { user: userFilter } = await searchParams

  if (userFilter) {
    redirect(`/settings/listening-sessions/${userFilter}`)
  }

  const baseQuery = 'page=0&itemsPerPage=10&sort=updatedAt&desc=1'

  const [usersResponse, sessionsResponse, openSessionsResponse] = await getData(getUsers(), getListeningSessions(baseQuery), getOpenListeningSessions())

  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

  return <ListeningSessionsClient users={users} sessionsResponse={sessionsResponse} openSessionsResponse={openSessionsResponse} />
}
