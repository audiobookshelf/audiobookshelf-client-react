import AccountStatsSummary from '@/components/stats/AccountStatsSummary'
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

  const user = currentUser.user
  const itemsFinished = user.mediaProgress.filter((p) => p.isFinished).length
  const days = listeningStats.days ?? {}
  const daysListened = Object.values(days).length
  const minutesListening = Math.round((listeningStats.totalTime ?? 0) / 60)

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-2xl">{t('HeaderYourStats')}</h1>
      <AccountStatsSummary itemsFinished={itemsFinished} daysListened={daysListened} minutesListening={minutesListening} />
      <div className="mt-6">
        <AccountStatsClient daysListening={days} />
      </div>
    </div>
  )
}
