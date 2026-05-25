import { getData, getEmailSettings, getUsers } from '@/lib/api'
import EmailClient from './EmailClient'
import EReaderDevicesClient from './EReaderDevicesClient'

export const dynamic = 'force-dynamic'

export default async function EmailSettingsPage() {
  const [emailSettingsResponse, usersResponse] = await getData(getEmailSettings(), getUsers())

  if (!emailSettingsResponse) {
    return <div>Error loading email settings</div>
  }

  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

  return (
    <>
      <EmailClient initialSettings={emailSettingsResponse.settings} />
      <EReaderDevicesClient initialDevices={emailSettingsResponse.settings.ereaderDevices} users={users} />
    </>
  )
}
