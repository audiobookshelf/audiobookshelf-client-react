import { getAuthSettings, getData } from '@/lib/api'
import { getBasePath } from '@/lib/basePath'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AuthenticationClient from './AuthenticationClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsAuthentication')
}

export default async function AuthenticationSettingsPage() {
  const [authSettings] = await getData(getAuthSettings())

  if (!authSettings) {
    redirect('/settings/general')
  }

  return <AuthenticationClient initialSettings={authSettings} routerBasePath={getBasePath()} />
}
