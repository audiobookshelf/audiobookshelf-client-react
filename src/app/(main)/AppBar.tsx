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

  const currentLibrary = libraries?.find((lib) => lib.id === currentLibraryId)
  return (
    <div className="w-full h-16 bg-primary flex items-center justify-start px-2 md:px-6 gap-2 md:gap-4 shadow-xl">
      <Link href={'/'} title={t('ButtonHome')} className="text-sm text-foreground hover:text-foreground/80">
        <Image src="/icon.svg" alt="audiobookshelf" width={40} height={40} priority className="w-8 min-w-8 h-8 sm:w-10 sm:min-w-10 sm:h-10 mx-2" />
      </Link>
      <Link href={'/'} title={t('ButtonHome')} className="text-sm text-foreground hover:text-foreground/80 hidden lg:block">
        <h1 className="text-xl hover:underline">audiobookshelf</h1>
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

      {/* Search Input or Search Button */}
      <div className="flex-1 min-w-0 max-w-70">
        {isSearchMode ? (
          <GlobalSearchInput autoFocus onSubmit={handleSearchSubmit} />
        ) : (
          <>
            {/* Show search bar on desktop, search button on mobile */}
            <div className="hidden md:block">
              <GlobalSearchInput onSubmit={handleSearchSubmit} />
            </div>
            <div className="md:hidden">
              <IconBtn borderless ariaLabel={t('ButtonSearch')} onClick={handleSearchModeToggle} className="text-foreground hover:text-foreground/80">
                search
              </IconBtn>
            </div>
          </>
        )}
      </div>

      <div className="ms-auto">
        <AppBarNav userCanUpload={userCanUpload} isAdmin={['admin', 'root'].includes(user.type)} username={user.username} />
      </div>
    </div>
  )
}
