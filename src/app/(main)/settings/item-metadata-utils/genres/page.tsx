import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsGenresPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderManageGenres')} backLink="/settings/item-metadata-utils">
      <div></div>
    </SettingsContent>
  )
}
