import { getData, getEmailSettings, getUsers } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import EmailClient from './EmailClient'
import EReaderDevicesClient from './EReaderDevicesClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsEmail')
}

export default async function EmailSettingsPage() {
  const t = await getTypeSafeTranslations()
  const [emailSettingsResponse, usersResponse] = await getData(getEmailSettings(), getUsers())

  if (!emailSettingsResponse) {
    return <div>{t('MessageFailedToLoadData')}</div>
  }

  const users = [...(usersResponse?.users || [])].sort((a, b) => a.createdAt - b.createdAt)

  return (
    <>
      <EmailClient initialSettings={emailSettingsResponse.settings} />
      <EReaderDevicesClient initialDevices={emailSettingsResponse.settings.ereaderDevices} users={users} />
    </>
  )
}
