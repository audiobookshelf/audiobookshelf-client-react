import { getUsers } from '../../../../lib/api'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const usersResponse = await getUsers()
  const users = usersResponse.data?.users || []

  return <UsersClient users={users} />
}
