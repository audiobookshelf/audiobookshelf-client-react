import { getUsers, getData } from '../../../../lib/api'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [usersResponse] = await getData(getUsers())
  const users = usersResponse.data?.users || []

  return <UsersClient users={users} />
}
