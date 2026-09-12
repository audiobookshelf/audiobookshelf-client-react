import { getData, getTags } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import SettingsContent from '../../SettingsContent'
import TagsClient from './TagsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsManageTags')
}

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
