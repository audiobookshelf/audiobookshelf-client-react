'use client'

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
      {/* Hamburger Menu Button - Always Visible */}
      <div className="relative">
        <IconBtn borderless ariaLabel={t('ButtonMenu')} onClick={toggleMenu}>
          menu
        </IconBtn>

        {/* Dropdown Menu */}
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

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-start px-4 py-3 hover:bg-primary-hover text-foreground transition-colors w-full text-left"
                  aria-label={t('ButtonLogout')}
                >
                  <span className="material-symbols text-xl mr-3">logout</span>
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
