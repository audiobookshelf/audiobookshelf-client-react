import PageMessage from '@/components/ui/PageMessage'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

export default async function CollectionNotFound() {
  const t = await getTypeSafeTranslations()

  return <PageMessage message={t('MessageCollectionNotFound')} description={t('MessageCollectionMayHaveBeenRemoved')} />
}
