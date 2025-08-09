import { getCurrentUser } from '../../../lib/api'
import LogoutBtn from './LogoutBtn'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const userResponse = await getCurrentUser()
  const user = userResponse.data?.user

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">Account</h1>

      <div className="flex flex-col items-start gap-4 mt-8">
        <p>Username: {user?.username}</p>
        <LogoutBtn />
      </div>
    </div>
  )
}
