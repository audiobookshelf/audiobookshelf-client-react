import { useTranslations } from 'next-intl'
import ChangePasswordClient from './ChangePasswordClient'
import { changePassword } from './actions'

export default function ChangePasswordPage() {
  const t = useTranslations()

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">{t('HeaderChangePassword')}</h1>
      <ChangePasswordClient changePassword={changePassword} />
    </div>
  )
}
