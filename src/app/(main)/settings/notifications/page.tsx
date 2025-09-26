import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderNotifications')}>
      <div></div>
    </SettingsContent>
  )
}
