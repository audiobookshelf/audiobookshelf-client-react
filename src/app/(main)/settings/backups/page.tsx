import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function BackupsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderBackups')}>
      <div></div>
    </SettingsContent>
  )
}
