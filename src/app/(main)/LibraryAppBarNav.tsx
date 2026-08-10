'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { Library } from '@/types/api'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import GlobalSearchInput from './GlobalSearchInput'
import LibrariesDropdown from './LibrariesDropdown'

interface LibraryAppBarNavProps {
  libraries: Library[]
  currentLibraryId: string
  currentLibrary: Library
}

export default function LibraryAppBarNav({ libraries, currentLibraryId, currentLibrary }: LibraryAppBarNavProps) {
  const t = useTypeSafeTranslations()
  const [isSearchMode, setIsSearchMode] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const handleSearchModeToggle = useCallback(() => {
    if (isSearchMode) {
      setIsSearchMode(false)
      return
    }
    // Render the search input before focus() so the ref exists and mobile browsers treat focus as part of this tap (keyboard opens).
    flushSync(() => {
      setIsSearchMode(true)
    })
    mobileSearchInputRef.current?.focus({ preventScroll: true })
  }, [isSearchMode])

  const handleSearchSubmit = useCallback(() => {
    setIsSearchMode(false)
  }, [])

  return (
    <>
      <div className={mergeClasses('min-w-0 flex-1 md:w-fit md:flex-none md:shrink-0', isSearchMode && 'hidden md:block')}>
        <LibrariesDropdown currentLibraryId={currentLibraryId} libraries={libraries} />
      </div>

      {isSearchMode && (
        <div className="shrink-0 md:hidden">
          <Tooltip text={currentLibrary.name} position="bottom">
            <IconBtn borderless ariaLabel={t('ButtonLibrary')} onClick={handleSearchModeToggle} className="text-foreground hover:text-foreground/80">
              library_books
            </IconBtn>
          </Tooltip>
        </div>
      )}

      {/* Search Input — only mount flex slot when search is visible (avoids min-width on mobile) */}
      {isSearchMode ? (
        <div className="min-w-0 flex-1">
          <GlobalSearchInput ref={mobileSearchInputRef} usePortal onSubmit={handleSearchSubmit} libraryId={currentLibraryId} />
        </div>
      ) : (
        <div className="hidden min-w-0 md:block md:w-80 md:shrink-0">
          <GlobalSearchInput usePortal onSubmit={handleSearchSubmit} libraryId={currentLibraryId} />
        </div>
      )}

      <div className="min-w-0 flex-1 max-md:hidden" aria-hidden="true" />

      {!isSearchMode && (
        <IconBtn borderless ariaLabel={t('ButtonSearch')} onClick={handleSearchModeToggle} className="shrink-0 md:hidden">
          search
        </IconBtn>
      )}
    </>
  )
}
