'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ChromecastLauncher from '@/components/widgets/ChromecastLauncher'
import NotificationWidget from '@/components/widgets/NotificationWidget'
import { useAppNavigation } from '@/contexts/AppNavigationContext'
import { useUser } from '@/contexts/UserContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { resolveEffectiveLibrary } from '@/lib/libraries'
import { mergeClasses } from '@/lib/merge-classes'
import { Library } from '@/types/api'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppBarSelectionOverlay from './AppBarSelectionOverlay'
import LibraryAppBarNav from './LibraryAppBarNav'
import SettingsAppBarNav from './settings/SettingsAppBarNav'
import SideRailMobileDrawer from './SideRailMobileDrawer'
import UserAppBarNav from './UserAppBarNav'

interface AppBarProps {
  libraries?: Library[]
  currentLibraryId?: string
}

export default function AppBar({ libraries, currentLibraryId }: AppBarProps) {
  const t = useTypeSafeTranslations()
  const pathname = usePathname()
  const isSettingsRoute = pathname.startsWith('/settings')
  const isMobile = useMediaQuery('max-md')
  const [isSideRailOpen, setIsSideRailOpen] = useState(false)
  const { user, userDefaultLibraryId, userCanUpload } = useUser()
  // When not on a library page, use the last current library id when navigating home
  const { lastCurrentLibraryId, setLastCurrentLibraryId } = useAppNavigation()

  const toggleSideRail = useCallback(() => {
    setIsSideRailOpen((prev) => !prev)
  }, [])

  const closeSideRail = useCallback(() => {
    setIsSideRailOpen(false)
  }, [])

  useEffect(() => {
    if (!isMobile && isSideRailOpen) {
      setIsSideRailOpen(false)
    }
  }, [isMobile, isSideRailOpen])

  const isAdmin = ['admin', 'root'].includes(user.type)

  const preferredLibraryId = currentLibraryId || lastCurrentLibraryId || userDefaultLibraryId
  const currentLibrary = useMemo(() => resolveEffectiveLibrary(libraries, preferredLibraryId), [libraries, preferredLibraryId])
  const effectiveLibraryId = currentLibrary?.id
  const redirectLibraryId = effectiveLibraryId
  // New installs have no libraries — logo goes to empty /library home
  const redirectUrl = redirectLibraryId ? `/library/${redirectLibraryId}` : '/library'
  const showMobileSideRailToggle = Boolean(effectiveLibraryId && currentLibrary && !isSettingsRoute)

  useEffect(() => {
    if (!effectiveLibraryId || currentLibraryId) return
    if (lastCurrentLibraryId !== effectiveLibraryId) {
      setLastCurrentLibraryId(effectiveLibraryId)
    }
  }, [currentLibraryId, effectiveLibraryId, lastCurrentLibraryId, setLastCurrentLibraryId])

  const logoContent = (
    <>
      <Image src="/images/icon.svg" alt="" width={40} height={40} priority className="h-8 w-8 min-w-8 sm:h-10 sm:w-10 sm:min-w-10" />
      <span className="hidden text-xl hover:underline lg:block">audiobookshelf</span>
    </>
  )

  const LOGO_BUTTON_CLASSES = 'text-foreground hover:text-foreground/80 flex shrink-0 items-center justify-start gap-2 p-1 text-sm md:gap-4'

  return (
    <div className="bg-primary relative h-16 w-full">
      <header
        cy-id="appbar"
        className="box-shadow-appbar absolute start-0 top-0 bottom-0 z-60 flex h-full w-full min-w-0 items-center justify-start gap-1 px-2 py-1 max-md:overflow-x-hidden md:gap-4 md:px-6"
      >
        {showMobileSideRailToggle && (
          <IconBtn
            borderless
            ariaLabel={isSideRailOpen ? t('ButtonClose') : t('ButtonMenu')}
            aria-expanded={isSideRailOpen}
            className="shrink-0 md:hidden"
            onClick={toggleSideRail}
          >
            menu
          </IconBtn>
        )}
        <ButtonBase
          to={redirectUrl}
          borderless
          size="custom"
          ariaLabel={t('ButtonHome')}
          className={mergeClasses(LOGO_BUTTON_CLASSES, showMobileSideRailToggle && 'hidden md:flex')}
        >
          {logoContent}
        </ButtonBase>

        {isSettingsRoute && <SettingsAppBarNav />}

        {!isSettingsRoute && libraries && effectiveLibraryId && currentLibrary && (
          <LibraryAppBarNav libraries={libraries} currentLibraryId={effectiveLibraryId} currentLibrary={currentLibrary} />
        )}

        <div className="ms-auto flex shrink-0 items-center gap-0.5 md:gap-1">
          <ChromecastLauncher libraryId={currentLibraryId} />
          <NotificationWidget />

          {isAdmin && !isSettingsRoute && (
            <Tooltip text={t('HeaderSettings')} position="bottom">
              <IconBtn borderless ariaLabel={t('HeaderSettings')} to={isMobile ? '/settings' : '/settings/general'}>
                settings
              </IconBtn>
            </Tooltip>
          )}

          {userCanUpload && effectiveLibraryId && currentLibrary && !isSettingsRoute && (
            <Tooltip text={t('ButtonUpload')} position="bottom">
              <IconBtn borderless ariaLabel={t('ButtonUpload')} to="/upload" className="hidden md:inline-flex">
                upload
              </IconBtn>
            </Tooltip>
          )}

          <UserAppBarNav />
        </div>
      </header>
      <AppBarSelectionOverlay libraryId={effectiveLibraryId} />
      {showMobileSideRailToggle && isMobile && (
        <SideRailMobileDrawer isOpen={isSideRailOpen} onClose={closeSideRail} libraries={libraries} currentLibraryId={currentLibraryId} />
      )}
    </div>
  )
}
