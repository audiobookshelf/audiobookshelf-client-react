'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library, User } from '@/types/api'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import AppBarNav from './AppBarNav'
import GlobalSearchInput from './GlobalSearchInput'
import LibrariesDropdown from './LibrariesDropdown'

interface AppBarProps {
  libraries?: Library[]
  currentLibraryId?: string
  user: User
}

export default function AppBar({ libraries, currentLibraryId, user }: AppBarProps) {
  const t = useTypeSafeTranslations()
  const userCanUpload = user.permissions.upload
  const [isSearchMode, setIsSearchMode] = useState(false)

  const handleSearchModeToggle = useCallback(() => {
    setIsSearchMode((prev) => !prev)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    setIsSearchMode(false)
  }, [])

  const isAdmin = ['admin', 'root'].includes(user.type)

  const currentLibrary = libraries?.find((lib) => lib.id === currentLibraryId)
  return (
    <div className="w-full h-16 bg-primary relative">
      <header
        cy-id="appbar"
        className="absolute top-0 bottom-0 start-0 w-full h-full px-2 md:px-6 py-1 z-60 flex items-center justify-start gap-2 md:gap-4 box-shadow-appbar"
      >
        <Link
          href={'/'}
          aria-label={`audiobookshelf - ${t('ButtonHome')}`}
          className="text-sm text-foreground hover:text-foreground/80 flex items-center justify-start gap-2 md:gap-4"
        >
          <Image src="/images/icon.svg" alt="" width={40} height={40} priority className="w-8 min-w-8 h-8 sm:w-10 sm:min-w-10 sm:h-10" />
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
        <div className="flex-1 min-w-0 max-w-70">
          {isSearchMode ? (
            <GlobalSearchInput autoFocus onSubmit={handleSearchSubmit} libraryId={currentLibraryId} />
          ) : (
            <div className="hidden md:block">
              <GlobalSearchInput onSubmit={handleSearchSubmit} libraryId={currentLibraryId} />
            </div>
          )}
        </div>

        {!isSearchMode && (
          <>
            <div className="flex-grow" />

            {/* Mobile only - Search Icon toggles search mode */}
            <IconBtn borderless ariaLabel={t('ButtonSearch')} onClick={handleSearchModeToggle} className="md:hidden">
              search
            </IconBtn>
          </>
        )}

        {/* Desktop only - Settings and Upload Buttons */}
        {isAdmin && (
          <div className="hidden md:flex items-center">
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

        <div className="ms-auto">
          <AppBarNav userCanUpload={userCanUpload} isAdmin={isAdmin} username={user.username} />
        </div>
      </header>
    </div>
  )
}
