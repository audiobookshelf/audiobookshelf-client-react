import TextInput from '@/components/ui/TextInput'

import { getCurrentUser } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

import Btn from '@/components/ui/Btn'
import { cookies } from 'next/headers'
import LogoutBtn from './LogoutBtn'
import UserLanguageSelector from './UserLanguageSelector'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const currentUser = await getCurrentUser()
  const t = await getTypeSafeTranslations()
  const user = currentUser?.user

  // Get current language from cookies (userLanguage takes precedence over language)
  const cookieStore = await cookies()
  const currentLanguage = cookieStore.get('userLanguage')?.value || cookieStore.get('language')?.value || 'en-us'

  if (!user) {
    return null
  }

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">{t('HeaderAccount')}</h1>

      <div className="flex flex-col items-start gap-4 mt-8">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-2">
            <TextInput value={user.username} label={t('LabelUsername')} readOnly />
          </div>
          <div className="flex-1">
            <TextInput value={user.type} label="Account Type" readOnly />
          </div>
        </div>
        <div className="w-full">
          <UserLanguageSelector value={currentLanguage} label={t('LabelLanguage')} />
        </div>
        <div className="w-full h-px bg-border" />
        <div className="flex items-center justify-between w-full">
          <Btn to="/account/change-password">{t('LabelChangePassword')}</Btn>
          <LogoutBtn />
        </div>
      </div>
    </div>
  )
}
