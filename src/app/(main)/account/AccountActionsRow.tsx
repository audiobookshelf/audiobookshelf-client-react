'use client'

import Btn from '@/components/ui/Btn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import LogoutBtn from './LogoutBtn'

const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export default function AccountActionsRow() {
  const t = useTypeSafeTranslations()
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)
  const size = isMobile ? 'small' : 'medium'

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
      <Btn to="/account/change-password" size={size} className="shrink-0 whitespace-nowrap">
        {t('LabelChangePassword')}
      </Btn>
      <LogoutBtn size={size} />
    </div>
  )
}
