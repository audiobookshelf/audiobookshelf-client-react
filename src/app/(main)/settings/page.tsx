import { getCurrentUser, getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { ServerSettings } from '@/types/api'
import { updateServerSettings } from './actions'
import SettingsClient from './SettingsClient'
import SettingsContent from './SettingsContent'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const t = await getTypeSafeTranslations()
  const [userResponse] = await getData(getCurrentUser())

  const serverSettings = userResponse.data?.serverSettings

  // TODO: Handle loading data error?
  if (!serverSettings) {
    return <div>Placeholder error</div>
  }

  return (
    <SettingsContent title={t('HeaderSettings')}>
      <SettingsClient serverSettings={serverSettings as ServerSettings} updateServerSettings={updateServerSettings} />
    </SettingsContent>
  )
}
