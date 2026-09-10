import { getData, getNotifications } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsNotifications')
}

export default async function NotificationsPage() {
  const t = await getTypeSafeTranslations()
  const [notificationsResponse] = await getData(getNotifications())

  if (!notificationsResponse) {
    return <div>{t('MessageFailedToLoadData')}</div>
  }

  return <NotificationsClient initialSettings={notificationsResponse.settings} notificationData={notificationsResponse.data} />
}
