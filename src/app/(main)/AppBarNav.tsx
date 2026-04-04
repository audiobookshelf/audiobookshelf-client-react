'use client'

import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

interface AppBarNavProps {
  userCanUpload: boolean
  isAdmin: boolean
  username: string
}

export default function AppBarNav({ userCanUpload, isAdmin, username }: AppBarNavProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      // Calls the Abs server logout endpoint and clears the NextJS server cookies
      const res = await fetch('/internal-api/logout', {
        method: 'POST'
      })
      if (!res.ok) {
        console.error('Logout error:', res.status, res.statusText)
        return
      }
      router.replace('/login')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      closeMenu()
    }
  }, [router, closeMenu])

  return (
    <>
      <div className="relative">
        {/* Desktop - Username Dropdown */}
        <Btn
          size="small"
          ariaDescription={t('ButtonMenu')}
          ariaExpanded={mobileMenuOpen}
          className="hidden min-w-24 justify-between ps-3 pe-2 md:flex"
          onClick={toggleMenu}
        >
          <span className="block truncate text-sm">{username}</span>
          <span className="material-symbols text-xl" aria-hidden="true">
            person
          </span>
        </Btn>

        {/* Mobile - Hamburger Menu Button */}
        <IconBtn borderless ariaLabel={t('ButtonMenu')} className="md:hidden" onClick={toggleMenu}>
          menu
        </IconBtn>

        {/* Dropdown Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={closeMenu} />

            {/* Menu */}
            <div className="bg-primary border-border absolute top-full right-0 z-50 mt-2 min-w-[200px] rounded-md border shadow-lg">
              <nav className="flex flex-col py-1">
                <Link
                  href="/account"
                  className="hover:bg-primary-hover text-foreground border-border flex items-center justify-start border-b px-4 py-3 transition-colors"
                  aria-label={t('HeaderAccount')}
                  onClick={closeMenu}
                >
                  <span className="material-symbols mr-3 text-xl">person</span>
                  <span className="text-sm font-semibold">{username}</span>
                </Link>

                {/* Mobile only - Settings Button */}
                {isAdmin && (
                  <Link
                    href="/settings"
                    className="hover:bg-primary-hover text-foreground flex items-center justify-start px-4 py-3 transition-colors md:hidden"
                    aria-label={t('HeaderSettings')}
                    onClick={closeMenu}
                  >
                    <span className="material-symbols mr-3 text-xl">settings</span>
                    <span className="text-sm">{t('HeaderSettings')}</span>
                  </Link>
                )}

                {userCanUpload && (
                  <Link
                    href="/upload"
                    className="hover:bg-primary-hover text-foreground flex items-center justify-start px-4 py-3 transition-colors md:hidden"
                    aria-label={t('ButtonUpload')}
                    onClick={closeMenu}
                  >
                    <span className="material-symbols mr-3 text-xl">upload</span>
                    <span className="text-sm">{t('ButtonUpload')}</span>
                  </Link>
                )}

                <Link
                  href="/account/stats"
                  className="hover:bg-primary-hover text-foreground flex items-center justify-start px-4 py-3 transition-colors"
                  aria-label={t('ButtonStats')}
                  onClick={closeMenu}
                >
                  <span className="material-symbols mr-3 text-xl">equalizer</span>
                  <span className="text-sm">{t('ButtonStats')}</span>
                </Link>

                <Link
                  href="/components_catalog"
                  className="hover:bg-primary-hover text-foreground flex items-center justify-start px-4 py-3 transition-colors"
                  aria-label={t('ButtonComponentsCatalog')}
                  onClick={closeMenu}
                >
                  <span className="material-symbols mr-3 text-xl">widgets</span>
                  <span className="text-sm">{t('ButtonComponentsCatalog')}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="hover:bg-primary-hover text-foreground flex w-full items-center justify-start px-4 py-3 text-left transition-colors"
                  aria-label={t('ButtonLogout')}
                >
                  <span className="material-symbols mr-3 text-xl">logout</span>
                  <span className="text-sm">{t('ButtonLogout')}</span>
                </button>
              </nav>
            </div>
          </>
        )}
      </div>
    </>
  )
}
