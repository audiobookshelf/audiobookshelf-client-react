import { getApiKeys, getData, getUsers } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import ApiKeysClient from './ApiKeysClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsApiKeys')
}

export default async function ApiKeysPage() {
  const [apiKeysResponse, usersResponse] = await getData(getApiKeys(), getUsers())
  const apiKeys = apiKeysResponse?.apiKeys || []
  const users = usersResponse?.users || []

  return <ApiKeysClient apiKeys={apiKeys} users={users} />
}
