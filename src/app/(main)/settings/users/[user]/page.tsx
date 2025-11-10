import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import Link from 'next/link'
import { getData, getUser } from '../../../../../lib/api'

export const dynamic = 'force-dynamic'

export default async function UserPage({ params }: { params: Promise<{ user: string }> }) {
  const t = await getTypeSafeTranslations()
  const { user: userId } = await params

  const [user] = await getData(getUser(userId))

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-6">
      <div className="bg-bg rounded-md shadow-lg border border-white/5 p-2 sm:p-4 mb-8">
        <Link href="/settings/users" className="flex items-center gap-2 text-foreground-muted hover:text-foreground mb-4">
          <span className="material-symbols text-xl">arrow_back</span>
          <span>{t('LabelBackToUsers')}</span>
        </Link>
        <div className="flex flex-col gap-2 py-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl">{user.username}</h1>
          </div>
          <div className="bg-black p-2 rounded border">
            <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
