import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderApiKeys')} moreInfoUrl="https://www.audiobookshelf.org/guides/api-keys">
      <div></div>
    </SettingsContent>
  )
}
