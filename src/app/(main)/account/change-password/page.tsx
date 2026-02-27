import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import Link from 'next/link'
import ChangePasswordClient from './ChangePasswordClient'
import { changePassword } from './actions'

export default async function ChangePasswordPage() {
  const t = await getTypeSafeTranslations()

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link aria-label={t('ButtonBack')} href="/account" className="text-foreground-muted hover:text-foreground">
          <span className="material-symbols text-xl">arrow_back</span>
        </Link>

        <h1 className="text-xl">{t('HeaderChangePassword')}</h1>
      </div>
      <ChangePasswordClient changePassword={changePassword} />
    </div>
  )
}
