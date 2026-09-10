import { getData, getLibraries } from '../../../../lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import LibrariesClient from './LibrariesClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsLibraries')
}

export default async function LibrariesPage() {
  const [librariesResponse] = await getData(getLibraries())
  const libraries = librariesResponse?.libraries || []

  return <LibrariesClient libraries={libraries} />
}
