import { getData, getNotifications } from '@/lib/api'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const [notificationsResponse] = await getData(getNotifications())

  if (!notificationsResponse) {
    return <div>Error loading notifications</div>
  }

  return <NotificationsClient initialSettings={notificationsResponse.settings} notificationData={notificationsResponse.data} />
}
