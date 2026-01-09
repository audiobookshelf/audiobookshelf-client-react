import { getApiKeys, getData } from '@/lib/api'
import ApiKeysClient from './ApiKeysClient'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const [apiKeysResponse] = await getData(getApiKeys())
  const apiKeys = apiKeysResponse?.apiKeys || []

  return <ApiKeysClient apiKeys={apiKeys} />
}
