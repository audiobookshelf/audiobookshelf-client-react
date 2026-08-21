import PageMessage from '@/components/ui/PageMessage'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

export default async function ItemNotFound() {
  const t = await getTypeSafeTranslations()

  return <PageMessage message={t('MessageLibraryItemNotFound')} description={t('MessageLibraryItemMayHaveBeenRemoved')} />
}
