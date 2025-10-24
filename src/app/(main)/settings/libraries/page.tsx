import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { getData, getLibraries } from '../../../../lib/api'
import SettingsContent from '../SettingsContent'
import LibrariesList from './LibrariesList'
import { saveLibraryOrder } from './actions'

export const dynamic = 'force-dynamic'

export default async function LibrariesPage() {
  const t = await getTypeSafeTranslations()
  const [librariesResponse] = await getData(getLibraries())

  const libraries = librariesResponse?.libraries || []

  return (
    <SettingsContent title={t('HeaderLibraries')} moreInfoUrl="https://www.audiobookshelf.org/guides/library_creation">
      <LibrariesList libraries={libraries} saveLibraryOrderAction={saveLibraryOrder} />
    </SettingsContent>
  )
}
