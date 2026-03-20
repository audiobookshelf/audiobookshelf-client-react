import { getCustomMetadataProviders, getData } from '@/lib/api'
import CustomMetadataProvidersClient from './CustomMetadataProvidersClient'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsCustomMetadataProvidersPage() {
  const [providersResponse] = await getData(getCustomMetadataProviders())
  const providers = providersResponse?.providers || []

  return <CustomMetadataProvidersClient providers={providers} />
}
