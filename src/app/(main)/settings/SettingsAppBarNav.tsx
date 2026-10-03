'use client'

import IconBtn from '@/components/ui/IconBtn'
import MoreInfoIcon from '@/components/ui/MoreInfoIcon'
import { useAppNavigation } from '@/contexts/AppNavigationContext'
import { useUser } from '@/contexts/UserContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { usePathname } from 'next/navigation'
import { getSettingsAppBarMeta } from './settingsNavItems'

export default function SettingsAppBarNav() {
  const t = useTypeSafeTranslations()
  const pathname = usePathname()
  const isMobile = useMediaQuery('max-md')
  const { lastCurrentLibraryId, lastNonSettingsPath } = useAppNavigation()
  const { userDefaultLibraryId } = useUser()

  const { backHref, title, moreInfoUrl } = getSettingsAppBarMeta(pathname, isMobile, t, lastNonSettingsPath, lastCurrentLibraryId, userDefaultLibraryId)

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1 md:max-w-none md:flex-none">
        <IconBtn borderless ariaLabel={t('ButtonBack')} to={backHref} className="shrink-0">
          arrow_back
        </IconBtn>
        <span className={mergeClasses('truncate text-xl', isMobile ? 'min-w-0' : '')}>{title}</span>
        {moreInfoUrl && (
          <div className="ms-1 inline-flex shrink-0">
            <MoreInfoIcon moreInfoUrl={moreInfoUrl} size="xl" position="bottom" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 max-md:hidden" aria-hidden="true" />
    </>
  )
}
