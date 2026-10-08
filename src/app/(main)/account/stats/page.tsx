import AccountStatsSummary from '@/components/stats/AccountStatsSummary'
import { getCurrentUser, getData, getListeningStats } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { staticPageMetadata } from '@/lib/pageMetadata'
import { isUserAdminOrUp } from '@/lib/userPermissions'
import type { Metadata } from 'next'
import AccountStatsClient from './AccountStatsClient'
import YearInReview from './YearInReview'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfAccountStats')
}

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
  const isAdmin = isUserAdminOrUp(user.type)
  const month = new Date().getMonth()
  const showYearInReviewFirst = month === 11 || month === 0
  const yearInReview = <YearInReview userCreatedAt={user.createdAt} isAdmin={isAdmin} />

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      {showYearInReviewFirst && <div className="mb-8">{yearInReview}</div>}
      <h1 className="text-2xl">{t('HeaderYourStats')}</h1>
      <AccountStatsSummary itemsFinished={itemsFinished} daysListened={daysListened} minutesListening={minutesListening} />
      <div className="mt-6">
        <AccountStatsClient daysListening={days} recentSessions={listeningStats.recentSessions ?? []} userId={user.id} showViewAllSessions={isAdmin} />
      </div>
      {!showYearInReviewFirst && <div className="mt-8">{yearInReview}</div>}
    </div>
  )
}
