import PageMessage from '@/components/ui/PageMessage'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

export default async function UserNotFound() {
  const t = await getTypeSafeTranslations()

  return <PageMessage message={t('MessageUserNotFound')} description={t('MessageUserMayHaveBeenRemoved')} />
}
