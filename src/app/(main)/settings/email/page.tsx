import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function EmailSettingsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderEmail')} moreInfoUrl="https://www.audiobookshelf.org/guides/send_to_ereader">
      <div></div>
    </SettingsContent>
  )
}
