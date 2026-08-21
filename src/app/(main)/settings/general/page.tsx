import { getCurrentUser, getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { purgeCache, purgeItemsCache } from '../actions'
import SettingsCachePurge from '../SettingsCachePurge'
import GeneralSettingsClient from '../GeneralSettingsClient'
import SettingsContent from '../SettingsContent'
import SettingsFooter from '../SettingsFooter'

export const dynamic = 'force-dynamic'

export default async function GeneralSettingsPage() {
  const t = await getTypeSafeTranslations()
  const [currentUser] = await getData(getCurrentUser())

  const serverSettings = currentUser?.serverSettings

  // TODO: Handle loading data error?
  if (!serverSettings) {
    return <div>Placeholder error</div> // i18n-ignore
  }

  return (
    <>
      <SettingsContent title={t('HeaderSettingsGeneral')}>
        <GeneralSettingsClient />
      </SettingsContent>
      <SettingsCachePurge purgeCache={purgeCache} purgeItemsCache={purgeItemsCache} />
      <SettingsFooter />
    </>
  )
}
