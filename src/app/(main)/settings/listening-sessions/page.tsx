import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from '../SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ListeningSessionsPage() {
  const t = await getTypeSafeTranslations()
  return (
    <SettingsContent title={t('HeaderListeningSessions')}>
      <div></div>
    </SettingsContent>
  )
}
