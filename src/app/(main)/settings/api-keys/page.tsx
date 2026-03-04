import { getApiKeys, getData, getUsers } from '@/lib/api'
import ApiKeysClient from './ApiKeysClient'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const [apiKeysResponse, usersResponse] = await getData(getApiKeys(), getUsers())
  const apiKeys = apiKeysResponse?.apiKeys || []
  const users = usersResponse?.users || []

  return <ApiKeysClient apiKeys={apiKeys} users={users} />
}
