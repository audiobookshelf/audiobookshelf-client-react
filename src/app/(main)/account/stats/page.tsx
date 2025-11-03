import { getCurrentUser } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

export const dynamic = 'force-dynamic'

export default async function AccountStatsPage() {
  const t = await getTypeSafeTranslations()
  const currentUser = await getCurrentUser()

  if (!currentUser?.user) {
    return null
  }

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">{t('HeaderStats')}</h1>
    </div>
  )
}
