import { getAuthSettings, getData } from '@/lib/api'
import { redirect } from 'next/navigation'
import AuthenticationClient from './AuthenticationClient'

export const dynamic = 'force-dynamic'

export default async function AuthenticationSettingsPage() {
  const [authSettings] = await getData(getAuthSettings())

  if (!authSettings) {
    redirect('/settings')
  }

  // TODO: Find a better way to handle subfolders with nextjs
  const routerBasePath = process.env.ROUTER_BASE_PATH ?? ''

  return <AuthenticationClient initialSettings={authSettings} routerBasePath={routerBasePath} />
}
