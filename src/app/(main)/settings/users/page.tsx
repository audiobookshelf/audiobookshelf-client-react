import { getCurrentUser, getData, getUsers } from '../../../../lib/api'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [usersResponse, currentUser] = await getData(getUsers('include=latestSession'), getCurrentUser())
  const users = usersResponse?.users || []

  return <UsersClient currentUser={currentUser} users={users} serverSettings={currentUser.serverSettings} />
}
