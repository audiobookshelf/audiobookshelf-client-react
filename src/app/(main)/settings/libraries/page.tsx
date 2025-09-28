import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { apiRequest, getLibraries, getData } from '../../../../lib/api'
import LibrariesList from './LibrariesList'

export const dynamic = 'force-dynamic'

// Server Action
async function saveLibraryOrder(reorderObjects: { id: string; newOrder: number }[]) {
  'use server'

  const response = await apiRequest('/api/libraries/order', {
    method: 'POST',
    body: JSON.stringify(reorderObjects)
  })
  return response
}

export default async function LibrariesPage() {
  const t = await getTypeSafeTranslations()
  const [librariesResponse] = await getData(getLibraries())

  const librariesData = librariesResponse.data?.libraries || []

  return (
    <SettingsContent title={t('HeaderLibraries')} moreInfoUrl="https://www.audiobookshelf.org/guides/library_creation">
      <LibrariesList libraries={librariesData} saveLibraryOrder={saveLibraryOrder} />
    </SettingsContent>
  )
}
