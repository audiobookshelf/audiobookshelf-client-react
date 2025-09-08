import SettingsContent from '../SettingsContent'
import { getUsers } from '../../../../lib/api'
import Link from 'next/link'

export default async function UsersPage() {
  const usersResponse = await getUsers()
  const users = usersResponse.data?.users || []

  return (
    <SettingsContent title="Users" moreInfoUrl="https://www.audiobookshelf.org/guides/users">
      <div className="flex flex-col gap-2 py-4">
        {users.map((user: any) => (
          <div key={user.id}>
            <Link href={`/settings/users/${user.id}`} className="text-gray-300 hover:text-white">
              {user.username}
            </Link>
          </div>
        ))}
      </div>
    </SettingsContent>
  )
}
