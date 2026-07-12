'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ChromecastLauncher from '@/components/widgets/ChromecastLauncher'
import NotificationWidget from '@/components/widgets/NotificationWidget'
import { useMediaNavigation } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { Library } from '@/types/api'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import AppBarNav from './AppBarNav'
import AppBarSelectionOverlay from './AppBarSelectionOverlay'
import GlobalSearchInput from './GlobalSearchInput'
import LibrariesDropdown from './LibrariesDropdown'

interface AppBarProps {
  libraries?: Library[]
  currentLibraryId?: string
}

export default function AppBar({ libraries, currentLibraryId }: AppBarProps) {
  const t = useTypeSafeTranslations()
  const { user, userDefaultLibraryId } = useUser()
  const userCanUpload = user.permissions.upload
  const [isSearchMode, setIsSearchMode] = useState(false)
  // When not on a library page, use the last current library id when navigating home
  const { lastCurrentLibraryId } = useMediaNavigation()

  const handleSearchModeToggle = useCallback(() => {
    setIsSearchMode((prev) => !prev)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    setIsSearchMode(false)
  }, [])

  const isAdmin = ['admin', 'root'].includes(user.type)

  const effectiveLibraryId = currentLibraryId || lastCurrentLibraryId || userDefaultLibraryId
  const currentLibrary = libraries?.find((lib) => lib.id === effectiveLibraryId)
  const redirectLibraryId = effectiveLibraryId
  // New installs have no libraries, so redirect to settings
  const redirectUrl = redirectLibraryId ? `/library/${redirectLibraryId}` : '/settings'

  return (
    <div className="bg-primary relative h-16 w-full">
      <header
        cy-id="appbar"
        className="box-shadow-appbar absolute start-0 top-0 bottom-0 z-60 flex h-full w-full min-w-0 items-center justify-start gap-1 px-2 py-1 max-md:overflow-x-hidden md:gap-4 md:px-6"
      >
        <Link
          href={redirectUrl}
          aria-label={`audiobookshelf - ${t('ButtonHome')}`}
          className="text-foreground hover:text-foreground/80 flex shrink-0 items-center justify-start gap-2 text-sm md:gap-4"
        >
          <Image src="/images/icon.svg" alt="" width={40} height={40} priority className="h-8 w-8 min-w-8 sm:h-10 sm:w-10 sm:min-w-10" />
          <span className="hidden text-xl hover:underline md:block">audiobookshelf</span>
        </Link>

        {libraries && effectiveLibraryId && currentLibrary && (
          <>
            <div className={mergeClasses('min-w-0 flex-1 overflow-hidden md:w-fit md:flex-none md:shrink-0', isSearchMode && 'hidden md:block')}>
              <LibrariesDropdown currentLibraryId={effectiveLibraryId} libraries={libraries} />
            </div>

            {isSearchMode && currentLibrary && (
              <div className="shrink-0 md:hidden">
                <Tooltip text={currentLibrary.name} position="bottom">
                  <IconBtn borderless ariaLabel={t('ButtonLibrary')} onClick={handleSearchModeToggle} className="text-foreground hover:text-foreground/80">
                    library_books
                  </IconBtn>
                </Tooltip>
              </div>
            )}
          </>
        )}

        {/* Search Input — only mount flex slot when search is visible (avoids min-width on mobile) */}
        {currentLibrary &&
          (isSearchMode ? (
            <div className="min-w-0 flex-1">
              <GlobalSearchInput autoFocus onSubmit={handleSearchSubmit} libraryId={effectiveLibraryId} />
            </div>
          ) : (
            <div className="hidden min-w-0 flex-1 md:block md:min-w-24">
              <GlobalSearchInput onSubmit={handleSearchSubmit} libraryId={effectiveLibraryId} />
            </div>
          ))}

        {!isSearchMode && currentLibrary && (
          <IconBtn borderless ariaLabel={t('ButtonSearch')} onClick={handleSearchModeToggle} className="shrink-0 md:hidden">
            search
          </IconBtn>
        )}

        <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
          <ChromecastLauncher libraryId={currentLibraryId} />
          <NotificationWidget />

          {isAdmin && (
            <div className="hidden items-center gap-1 md:flex">
              <Tooltip text={t('ButtonUpload')} position="bottom">
                <IconBtn borderless ariaLabel={t('ButtonUpload')} to="/upload">
                  upload
                </IconBtn>
              </Tooltip>
              <Tooltip text={t('HeaderSettings')} position="bottom">
                <IconBtn borderless ariaLabel={t('HeaderSettings')} to="/settings">
                  settings
                </IconBtn>
              </Tooltip>
            </div>
          )}

          <AppBarNav userCanUpload={userCanUpload} isAdmin={isAdmin} username={user.username} />
        </div>
      </header>
      <AppBarSelectionOverlay libraryId={effectiveLibraryId} />
    </div>
  )
}
