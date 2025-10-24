import { getData, getUsers } from '../../../../lib/api'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [usersResponse] = await getData(getUsers())
  const users = usersResponse?.users || []

  return <UsersClient users={users} />
}
