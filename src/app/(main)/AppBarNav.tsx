'use client'

import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'

interface AppBarNavProps {
  userCanUpload: boolean
  isAdmin: boolean
  username: string
  libraries?: Library[]
  currentLibraryId?: string
}

export default function AppBarNav({ userCanUpload, isAdmin, username, libraries, currentLibraryId }: AppBarNavProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAllLibraries, setShowAllLibraries] = useState(false)
  const [, startTransition] = useTransition()

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const toggleShowAllLibraries = useCallback(() => {
    setShowAllLibraries((prev) => !prev)
  }, [])

  const currentLibrary = useMemo(() => {
    return libraries?.find((lib) => lib.id === currentLibraryId)
  }, [libraries, currentLibraryId])

  const hasMultipleLibraries = useMemo(() => {
    return libraries && libraries.length > 1
  }, [libraries])

  const getLibraryPath = useCallback(
    (libraryId: string) => {
      if (!libraries) return `/library/${libraryId}`
      const library = libraries.find((l) => l.id === libraryId)
      let page = pathname.split('/').pop() || ''
      const bookLibraryPages = ['bookshelf', 'series', 'collections', 'playlists', 'authors', 'narrators', 'stats']
      const podcastLibraryPages = ['bookshelf', 'latest', 'playlists', 'search', 'download-queue']

      if (library) {
        if (page && library.mediaType === 'book' && !bookLibraryPages.includes(page)) {
          page = ''
        } else if (page && library.mediaType === 'podcast' && !podcastLibraryPages.includes(page)) {
          page = ''
        }
      }

      return `/library/${libraryId}/${page}`
    },
    [libraries, pathname]
  )

  const handleLibraryChange = useCallback(
    (libraryId: string) => {
      startTransition(() => {
        router.push(getLibraryPath(libraryId))
      })
      closeMenu()
    },
    [router, getLibraryPath, closeMenu]
  )

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-0 sm:gap-1">
        <Tooltip text={t('ButtonComponentsCatalog')} position="bottom">
          <IconBtn borderless ariaLabel={t('ButtonComponentsCatalog')} to="/components_catalog">
            widgets
          </IconBtn>
        </Tooltip>

        {userCanUpload && (
          <Tooltip text={t('ButtonUpload')} position="bottom">
            <IconBtn borderless ariaLabel={t('ButtonUpload')} to="/upload">
              upload
            </IconBtn>
          </Tooltip>
        )}

        {isAdmin && (
          <Tooltip text={t('HeaderSettings')} position="bottom">
            <IconBtn borderless ariaLabel={t('HeaderSettings')} to="/settings">
              settings
            </IconBtn>
          </Tooltip>
        )}

        <Tooltip text={t('ButtonStats')} position="bottom">
          <IconBtn borderless ariaLabel={t('ButtonStats')} to="/account/stats">
            equalizer
          </IconBtn>
        </Tooltip>

        <Tooltip text={t('HeaderAccount')} position="bottom">
          <IconBtn borderless ariaLabel={t('HeaderAccount')} to="/account">
            person
          </IconBtn>
        </Tooltip>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden relative">
        <IconBtn borderless ariaLabel={t('ButtonMenu')} onClick={toggleMenu}>
          menu
        </IconBtn>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={closeMenu} />

            {/* Menu */}
            <div className="absolute right-0 top-full mt-2 bg-primary border border-border rounded-md shadow-lg z-50 min-w-[200px]">
              <nav className="flex flex-col py-1">
                <Link
                  href="/account"
                  className="flex items-center justify-start px-4 py-3 hover:bg-primary-hover text-foreground transition-colors border-b border-border"
                  aria-label={t('HeaderAccount')}
                  onClick={closeMenu}
                >
                  <span className="material-symbols text-xl mr-3">person</span>
                  <span className="text-sm font-semibold">{username}</span>
                </Link>

                {/* Library Selection (Mobile Only) */}
                {libraries && currentLibraryId && currentLibrary && (
                  <div className="border-b border-border">
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t('LabelLibrary')}</p>
                      <div className="flex flex-col gap-1">
                        {/* Current Library - Clickable */}
                        <button
                          onClick={hasMultipleLibraries ? toggleShowAllLibraries : undefined}
                          disabled={!hasMultipleLibraries}
                          className={`flex items-center justify-start px-2 py-2 rounded bg-primary-hover text-foreground font-semibold ${
                            hasMultipleLibraries ? 'hover:bg-primary-hover/80 cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          <span className="material-symbols text-lg mr-2">{currentLibrary.mediaType === 'podcast' ? 'podcasts' : 'library_books'}</span>
                          <span className="truncate">{currentLibrary.name}</span>
                          {hasMultipleLibraries && <span className="material-symbols text-lg ml-auto">{showAllLibraries ? 'expand_less' : 'unfold_more'}</span>}
                        </button>

                        {/* All Other Libraries (when expanded) */}
                        {hasMultipleLibraries &&
                          showAllLibraries &&
                          libraries
                            .filter((library) => library.id !== currentLibraryId)
                            .map((library) => (
                              <button
                                key={library.id}
                                onClick={() => handleLibraryChange(library.id)}
                                className="flex items-center justify-start px-2 py-2 rounded text-sm transition-colors hover:bg-primary-hover/50 text-foreground/80"
                              >
                                <span className="material-symbols text-lg mr-2">{library.mediaType === 'podcast' ? 'podcasts' : 'library_books'}</span>
                                <span className="truncate">{library.name}</span>
                              </button>
                            ))}
                      </div>
                    </div>
                  </div>
                )}

                {userCanUpload && (
                  <Link
                    href="/upload"
                    className="flex items-center justify-start px-4 py-3 hover:bg-primary-hover text-foreground transition-colors"
                    aria-label={t('ButtonUpload')}
                    onClick={closeMenu}
                  >
                    <span className="material-symbols text-xl mr-3">upload</span>
                    <span className="text-sm">{t('ButtonUpload')}</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/settings"
                    className="flex items-center justify-start px-4 py-3 hover:bg-primary-hover text-foreground transition-colors"
                    aria-label={t('HeaderSettings')}
                    onClick={closeMenu}
                  >
                    <span className="material-symbols text-xl mr-3">settings</span>
                    <span className="text-sm">{t('HeaderSettings')}</span>
                  </Link>
                )}

                <Link
                  href="/account/stats"
                  className="flex items-center justify-start px-4 py-3 hover:bg-primary-hover text-foreground transition-colors"
                  aria-label={t('ButtonStats')}
                  onClick={closeMenu}
                >
                  <span className="material-symbols text-xl mr-3">equalizer</span>
                  <span className="text-sm">{t('ButtonStats')}</span>
                </Link>

                <Link
                  href="/components_catalog"
                  className="flex items-center justify-start px-4 py-3 hover:bg-primary-hover text-foreground transition-colors"
                  aria-label={t('ButtonComponentsCatalog')}
                  onClick={closeMenu}
                >
                  <span className="material-symbols text-xl mr-3">widgets</span>
                  <span className="text-sm">{t('ButtonComponentsCatalog')}</span>
                </Link>
              </nav>
            </div>
          </>
        )}
      </div>
    </>
  )
}
