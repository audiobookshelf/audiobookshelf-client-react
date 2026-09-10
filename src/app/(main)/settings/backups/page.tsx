import { getBackups, getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import BackupsClient from './BackupsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleSettingsBackups')
}

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ backup?: string }> }) {
  const t = await getTypeSafeTranslations()
  const sp = await searchParams
  const [backupsResponse] = await getData(getBackups())

  if (!backupsResponse) {
    return <div>{t('MessageFailedToLoadData')}</div>
  }

  return <BackupsClient backupResponse={backupsResponse} appliedBackupToast={sp.backup === '1'} />
}
