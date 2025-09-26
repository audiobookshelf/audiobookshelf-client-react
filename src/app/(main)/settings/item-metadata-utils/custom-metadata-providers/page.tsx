import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsCustomMetadataProvidersPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent
      title={t('HeaderCustomMetadataProviders')}
      backLink="/settings/item-metadata-utils"
      moreInfoUrl="https://www.audiobookshelf.org/guides/custom-metadata-providers"
    >
      <div></div>
    </SettingsContent>
  )
}
