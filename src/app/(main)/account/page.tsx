import TextInput from '@/components/ui/TextInput'

import { getCurrentUser } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

import Btn from '@/components/ui/Btn'
import { getTheme } from '@/lib/theme'
import { cookies } from 'next/headers'
import LogoutBtn from './LogoutBtn'
import ThemeSelector from './ThemeSelector'
import UserLanguageSelector from './UserLanguageSelector'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const currentUser = await getCurrentUser()
  const t = await getTypeSafeTranslations()
  const user = currentUser?.user

  // Get current language from cookies (userLanguage takes precedence over language)
  const cookieStore = await cookies()
  const currentLanguage = cookieStore.get('userLanguage')?.value || cookieStore.get('language')?.value || 'en-us'

  // Get current theme
  const currentTheme = await getTheme()

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-xl p-8">
      <h1 className="text-xl">{t('HeaderAccount')}</h1>

      <div className="mt-8 flex flex-col items-start gap-4">
        <div className="flex w-full items-center gap-2">
          <div className="flex-2">
            <TextInput value={user.username} label={t('LabelUsername')} readOnly />
          </div>
          <div className="flex-1">
            <TextInput value={user.type} label={t('LabelAccountType')} readOnly />
          </div>
        </div>
        <div className="w-full">
          <UserLanguageSelector value={currentLanguage} label={t('LabelLanguage')} />
        </div>
        <div className="w-full">
          <ThemeSelector value={currentTheme} label={t('LabelTheme')} />
        </div>
        <div className="bg-border h-px w-full" />
        <div className="flex w-full items-center justify-between">
          <Btn to="/account/change-password">{t('LabelChangePassword')}</Btn>
          <LogoutBtn />
        </div>
      </div>
    </div>
  )
}
