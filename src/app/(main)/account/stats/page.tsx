import { getCurrentUser, getData, getListeningStats } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import AccountStatsClient from './AccountStatsClient'

export const dynamic = 'force-dynamic'

export default async function AccountStatsPage() {
  const t = await getTypeSafeTranslations()
  const [currentUser, listeningStats] = await getData(getCurrentUser(), getListeningStats())

  if (!currentUser?.user) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-2xl">{t('HeaderStats')}</h1>
      <AccountStatsClient daysListening={listeningStats.days ?? {}} />
    </div>
  )
}
