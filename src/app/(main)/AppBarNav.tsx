'use client'

import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { autoUpdate, offset, useFloating } from '@floating-ui/react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface AppBarNavProps {
  userCanUpload: boolean
  isAdmin: boolean
  username: string
}

export default function AppBarNav({ userCanUpload, isAdmin, username }: AppBarNavProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setMounted(true)
  }, [])

  const middleware = useMemo(() => [offset(8)], [])

  const { refs, floatingStyles, update } = useFloating({
    open: mobileMenuOpen,
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware
  })

  useEffect(() => {
    if (triggerRef.current) {
      refs.setReference(triggerRef.current)
    }
  }, [refs])

  useEffect(() => {
    if (menuRef.current && mobileMenuOpen) {
      refs.setFloating(menuRef.current)
      update()
    }
  }, [refs, mobileMenuOpen, update])

  useEffect(() => {
    if (!mobileMenuOpen || !refs.reference.current || !refs.floating.current) {
      return
    }

    return autoUpdate(refs.reference.current, refs.floating.current, update)
  }, [mobileMenuOpen, refs, update])

  const menuContent = (
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
  )

  return (
    <>
      <div ref={triggerRef} className="relative shrink-0">
        {/* Desktop - Username Dropdown */}
        <Btn
          size="small"
          ariaLabel={`${username}, ${t('ButtonMenu')}`}
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
        <IconBtn borderless ariaLabel={t('ButtonMenu')} aria-expanded={mobileMenuOpen} className="md:hidden" onClick={toggleMenu}>
          menu
        </IconBtn>
      </div>

      {mobileMenuOpen &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={closeMenu} aria-hidden="true" />
            <div ref={menuRef} className="bg-primary border-border z-[9999] min-w-[200px] rounded-md border shadow-lg" style={floatingStyles}>
              {menuContent}
            </div>
          </>,
          document.body
        )}
    </>
  )
}
