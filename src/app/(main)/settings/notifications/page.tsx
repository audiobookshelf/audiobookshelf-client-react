import { getData, getNotifications } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const t = await getTypeSafeTranslations()
  const [notificationsResponse] = await getData(getNotifications())

  if (!notificationsResponse) {
    return <div>{t('MessageFailedToLoadData')}</div>
  }

  return <NotificationsClient initialSettings={notificationsResponse.settings} notificationData={notificationsResponse.data} />
}
