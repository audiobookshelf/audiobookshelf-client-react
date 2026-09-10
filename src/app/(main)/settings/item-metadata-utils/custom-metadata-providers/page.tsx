import { getCustomMetadataProviders, getData } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import CustomMetadataProvidersClient from './CustomMetadataProvidersClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsCustomMetadataProviders')
}

export default async function ItemMetadataUtilsCustomMetadataProvidersPage() {
  const [providersResponse] = await getData(getCustomMetadataProviders())
  const providers = providersResponse?.providers || []

  return <CustomMetadataProvidersClient providers={providers} />
}
