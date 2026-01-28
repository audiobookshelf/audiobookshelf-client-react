import { getApiKeys, getCurrentUser, getData, getUsers } from '@/lib/api'
import ApiKeysClient from './ApiKeysClient'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const [apiKeysResponse, currentUser, usersResponse] = await getData(getApiKeys(), getCurrentUser(), getUsers())
  const apiKeys = apiKeysResponse?.apiKeys || []
  const users = usersResponse?.users || []

  return <ApiKeysClient apiKeys={apiKeys} currentUser={currentUser} users={users} />
}
