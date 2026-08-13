import { getBackups, getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import BackupsClient from './BackupsClient'

export const dynamic = 'force-dynamic'

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ backup?: string }> }) {
  const t = await getTypeSafeTranslations()
  const sp = await searchParams
  const [backupsResponse] = await getData(getBackups())

  if (!backupsResponse) {
    return <div>{t('MessageFailedToLoadData')}</div>
  }

  return <BackupsClient backupResponse={backupsResponse} appliedBackupToast={sp.backup === '1'} />
}
