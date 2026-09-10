import { getData, getUsers } from '../../../../lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsUsers')
}

export default async function UsersPage() {
  const [usersResponse] = await getData(getUsers('include=latestSession'))
  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

  return <UsersClient users={users} />
}
