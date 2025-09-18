import { getCurrentUser } from '@/lib/api'
import SettingsContent from '../../settings/SettingsContent'

export const dynamic = 'force-dynamic'

export default async function AccountStatsPage() {
  const userResponse = await getCurrentUser()
  const user = userResponse.data?.user

  if (!user) {
    return null
  }

  return (
    <SettingsContent title="Stats">
      <div></div>
    </SettingsContent>
  )
}
