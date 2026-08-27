import { getAuthSettings, getData } from '@/lib/api'
import { getBasePath } from '@/lib/basePath'
import { redirect } from 'next/navigation'
import AuthenticationClient from './AuthenticationClient'

export const dynamic = 'force-dynamic'

export default async function AuthenticationSettingsPage() {
  const [authSettings] = await getData(getAuthSettings())

  if (!authSettings) {
    redirect('/settings/general')
  }

  return <AuthenticationClient initialSettings={authSettings} routerBasePath={getBasePath()} />
}
