import { getData, getEmailSettings } from '@/lib/api'
import EmailClient from './EmailClient'

export const dynamic = 'force-dynamic'

export default async function EmailSettingsPage() {
  const [emailSettingsResponse] = await getData(getEmailSettings())

  if (!emailSettingsResponse) {
    return <div>Error loading email settings</div>
  }

  return <EmailClient initialSettings={emailSettingsResponse.settings} />
}
