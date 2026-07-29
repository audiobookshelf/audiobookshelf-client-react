import { getCurrentUser, getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { purgeCache, purgeItemsCache } from './actions'
import SettingsCachePurge from './SettingsCachePurge'
import SettingsClient from './SettingsClient'
import SettingsContent from './SettingsContent'
import SettingsFooter from './SettingsFooter'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const t = await getTypeSafeTranslations()
  const [currentUser] = await getData(getCurrentUser())

  const serverSettings = currentUser?.serverSettings

  // TODO: Handle loading data error?
  if (!serverSettings) {
    return <div>Placeholder error</div>
  }

  return (
    <>
      <SettingsContent title={t('HeaderSettings')}>
        <SettingsClient />
      </SettingsContent>
      <SettingsCachePurge purgeCache={purgeCache} purgeItemsCache={purgeItemsCache} />
      <SettingsFooter />
    </>
  )
}
