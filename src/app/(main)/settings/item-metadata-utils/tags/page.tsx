import { getData, getTags } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../../SettingsContent'
import TagsClient from './TagsClient'

export const dynamic = 'force-dynamic'

export default async function ItemMetadataUtilsTagsPage() {
  const t = await getTypeSafeTranslations()

  const [tagsResponse] = await getData(getTags())
  const tags = tagsResponse?.tags || []

  return (
    <SettingsContent title={t('HeaderManageTags')} backLink="/settings/item-metadata-utils">
      <TagsClient tags={tags} />
    </SettingsContent>
  )
}
