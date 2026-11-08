import { getCurrentUser, getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import { purgeCache, purgeItemsCache } from '../actions'
import SettingsCachePurge from '../SettingsCachePurge'
import GeneralSettingsClient from '../GeneralSettingsClient'
import SettingsContent from '../SettingsContent'
import SettingsFooter from '../SettingsFooter'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsGeneral')
}

export default async function GeneralSettingsPage() {
  const t = await getTypeSafeTranslations()
  const [currentUser] = await getData(getCurrentUser())

  const serverSettings = currentUser?.serverSettings

  if (!serverSettings) {
    return <div>{t('MessageFailedToLoadData')}</div>
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
