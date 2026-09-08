import PageMessage from '@/components/ui/PageMessage'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

export default async function PlaylistNotFound() {
  const t = await getTypeSafeTranslations()

  return <PageMessage message={t('MessagePlaylistNotFound')} description={t('MessagePlaylistMayHaveBeenRemoved')} />
}
