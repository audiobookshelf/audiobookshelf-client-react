import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsTagsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderManageTags')} backLink="/settings/item-metadata-utils">
      <div></div>
    </SettingsContent>
  )
}
