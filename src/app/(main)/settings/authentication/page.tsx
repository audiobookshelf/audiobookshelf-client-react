import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function AuthenticationSettingsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderAuthentication')}>
      <div></div>
    </SettingsContent>
  )
}
