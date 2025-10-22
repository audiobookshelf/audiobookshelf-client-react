import { getGenres } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../../SettingsContent'
import GenresClient from './GenresClient'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsGenresPage() {
  const t = await getTypeSafeTranslations()

  const genresResponse = await getGenres()
  const genres = genresResponse.data?.genres || []

  return (
    <SettingsContent title={t('HeaderManageGenres')} backLink="/settings/item-metadata-utils">
      <GenresClient genres={genres} />
    </SettingsContent>
  )
}
