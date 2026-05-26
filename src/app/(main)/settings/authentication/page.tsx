import { getAuthSettings, getData } from '@/lib/api'
import { redirect } from 'next/navigation'
import AuthenticationClient from './AuthenticationClient'

export const dynamic = 'force-dynamic'

export default async function AuthenticationSettingsPage() {
  const [authSettings] = await getData(getAuthSettings())

  if (!authSettings) {
    redirect('/settings')
  }

  return <AuthenticationClient initialSettings={authSettings} />
}
