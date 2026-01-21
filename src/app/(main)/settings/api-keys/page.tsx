import { getApiKeys, getCurrentUser, getData } from '@/lib/api'
import ApiKeysClient from './ApiKeysClient'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const [apiKeysResponse, currentUser] = await getData(getApiKeys(), getCurrentUser())
  const apiKeys = apiKeysResponse?.apiKeys || []

  return <ApiKeysClient apiKeys={apiKeys} currentUser={currentUser} />
}
