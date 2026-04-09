'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import NotificationWidget from '@/components/widgets/NotificationWidget'
import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import AppBarNav from './AppBarNav'
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
  const { lastCurrentLibraryId } = useMediaContext()

  const handleSearchModeToggle = useCallback(() => {
    setIsSearchMode((prev) => !prev)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    setIsSearchMode(false)
  }, [])

  const isAdmin = ['admin', 'root'].includes(user.type)

  const currentLibrary = libraries?.find((lib) => lib.id === currentLibraryId)
  const redirectLibraryId = currentLibraryId || lastCurrentLibraryId || userDefaultLibraryId
  // New installs have no libraries, so redirect to settings
  const redirectUrl = redirectLibraryId ? `/library/${redirectLibraryId}` : '/settings'

  return (
    <div className="bg-primary relative h-16 w-full">
      <header
        cy-id="appbar"
        className="box-shadow-appbar absolute start-0 top-0 bottom-0 z-60 flex h-full w-full items-center justify-start gap-2 px-2 py-1 md:gap-4 md:px-6"
      >
        <Link
          href={redirectUrl}
          aria-label={`audiobookshelf - ${t('ButtonHome')}`}
          className="text-foreground hover:text-foreground/80 flex items-center justify-start gap-2 text-sm md:gap-4"
        >
          <Image src="/images/icon.svg" alt="" width={40} height={40} priority className="h-8 w-8 min-w-8 sm:h-10 sm:w-10 sm:min-w-10" />
          <span className="text-xl hover:underline">audiobookshelf</span>
        </Link>

        {/* Libraries Dropdown or Library Books Button */}
        {libraries && currentLibraryId && !isSearchMode && <LibrariesDropdown currentLibraryId={currentLibraryId} libraries={libraries} />}

        {/* In search mode: show libraries dropdown on desktop, library_books button on mobile */}
        {isSearchMode && currentLibrary && (
          <>
            {/* Desktop: show libraries dropdown */}
            <div className="hidden md:block">
              <LibrariesDropdown currentLibraryId={currentLibraryId!} libraries={libraries!} />
            </div>
            {/* Mobile: show library_books button */}
            <div className="md:hidden">
              <Tooltip text={currentLibrary.name} position="bottom">
                <IconBtn borderless ariaLabel={t('ButtonLibrary')} onClick={handleSearchModeToggle} className="text-foreground hover:text-foreground/80">
                  library_books
                </IconBtn>
              </Tooltip>
            </div>
          </>
        )}

        {/* Search Input mobile and desktop */}
        {currentLibrary && (
          <div className="max-w-70 min-w-0 flex-1">
            {isSearchMode ? (
              <GlobalSearchInput autoFocus onSubmit={handleSearchSubmit} libraryId={currentLibraryId} />
            ) : (
              <div className="hidden md:block">
                <GlobalSearchInput onSubmit={handleSearchSubmit} libraryId={currentLibraryId} />
              </div>
            )}
          </div>
        )}

        {!currentLibrary && <div className="flex-grow" />}

        {!isSearchMode && currentLibrary && (
          <>
            <div className="flex-grow" />

            {/* Mobile only - Search Icon toggles search mode */}
            <IconBtn borderless ariaLabel={t('ButtonSearch')} onClick={handleSearchModeToggle} className="md:hidden">
              search
            </IconBtn>
          </>
        )}

        <div className="hidden items-center md:flex">
          <NotificationWidget />

          {/* Desktop only - Settings and Upload Buttons */}
          {isAdmin && (
            <>
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
            </>
          )}
        </div>

        <div className="ms-auto">
          <AppBarNav userCanUpload={userCanUpload} isAdmin={isAdmin} username={user.username} />
        </div>
      </header>
    </div>
  )
}
