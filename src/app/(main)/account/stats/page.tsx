import { getCurrentUser } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../../settings/SettingsContent'

export const dynamic = 'force-dynamic'

export default async function AccountStatsPage() {
  const t = await getTypeSafeTranslations()
  const currentUser = await getCurrentUser()

  if (!currentUser?.user) {
    return null
  }

  return (
    <SettingsContent title={t('HeaderStats')}>
      <div></div>
    </SettingsContent>
  )
}
