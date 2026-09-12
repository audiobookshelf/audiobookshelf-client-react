import { getData, getGenres } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import SettingsContent from '../../SettingsContent'
import GenresClient from './GenresClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsManageGenres')
}

export default async function ItemMetadataUtilsGenresPage() {
  const t = await getTypeSafeTranslations()

  const [genresResponse] = await getData(getGenres())
  const genres = genresResponse?.genres || []

  return (
    <SettingsContent title={t('HeaderManageGenres')} backLink="/settings/item-metadata-utils">
      <GenresClient genres={genres} />
    </SettingsContent>
  )
}
