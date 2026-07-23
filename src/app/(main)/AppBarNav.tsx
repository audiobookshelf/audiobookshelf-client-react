'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import IconBtn from '@/components/ui/IconBtn'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type AppBarNavMenuItemConfig, buildAppBarNavMenuItems } from './appBarNavMenuItems'
import AppBarNavMenuItem from './AppBarNavMenuItem'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

interface AppBarNavProps {
  userCanUpload: boolean
  isAdmin: boolean
  username: string
}

export default function AppBarNav({ userCanUpload, isAdmin, username }: AppBarNavProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY, true)
  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const desktopTriggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])

  const allMenuItems = useMemo(() => buildAppBarNavMenuItems({ username, isAdmin, userCanUpload, t }), [isAdmin, t, userCanUpload, username])

  const visibleMenuItems = useMemo(() => (isDesktop ? allMenuItems.filter((item) => !item.mobileOnly) : allMenuItems), [allMenuItems, isDesktop])

  const closeMenu = useCallback(
    (restoreDesktopFocus = false) => {
      setMenuOpen(false)
      setFocusedIndex(-1)
      if (restoreDesktopFocus && isDesktop) {
        desktopTriggerRef.current?.focus()
      }
    },
    [isDesktop]
  )

  const focusMenuItem = useCallback((index: number) => {
    setFocusedIndex(index)
    itemRefs.current[index]?.focus()
  }, [])

  const openMenu = useCallback(
    (startIndex = 0) => {
      setMenuOpen(true)
      const clampedIndex = Math.max(0, Math.min(startIndex, visibleMenuItems.length - 1))
      setFocusedIndex(clampedIndex)
    },
    [visibleMenuItems.length]
  )

  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      closeMenu(isDesktop)
    } else {
      openMenu()
    }
  }, [closeMenu, isDesktop, menuOpen, openMenu])

  const handleClickOutside = useCallback(() => {
    closeMenu(false)
  }, [closeMenu])

  useClickOutside(menuRef, triggerRef, handleClickOutside, true)

  const handleTriggerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleMenu()
    },
    [toggleMenu]
  )

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

  useEffect(() => {
    if (!menuOpen || focusedIndex < 0) return
    itemRefs.current[focusedIndex]?.focus()
  }, [menuOpen, focusedIndex])

  const middleware = useMemo(() => [offset(8), shift({ padding: 8 }), flip({ fallbackAxisSideDirection: 'start' })], [])

  const { refs, floatingStyles, update } = useFloating({
    open: menuOpen,
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
    if (menuRef.current && menuOpen) {
      refs.setFloating(menuRef.current)
      update()
    }
  }, [refs, menuOpen, update])

  useEffect(() => {
    if (!menuOpen || !refs.reference.current || !refs.floating.current) {
      return
    }

    return autoUpdate(refs.reference.current, refs.floating.current, update)
  }, [menuOpen, refs, update])

  const handleDesktopTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!menuOpen) {
          openMenu(0)
        } else if (focusedIndex < 0) {
          focusMenuItem(0)
        }
        break
      case 'Escape':
        if (menuOpen) {
          e.preventDefault()
          closeMenu(true)
        }
        break
      default:
        break
    }
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!visibleMenuItems.length) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const nextIndex = focusedIndex < visibleMenuItems.length - 1 ? focusedIndex + 1 : 0
        focusMenuItem(nextIndex)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : visibleMenuItems.length - 1
        focusMenuItem(prevIndex)
        break
      }
      case 'Home':
        e.preventDefault()
        focusMenuItem(0)
        break
      case 'End':
        e.preventDefault()
        focusMenuItem(visibleMenuItems.length - 1)
        break
      case 'Escape':
        e.preventDefault()
        closeMenu(isDesktop)
        break
      case 'Tab':
        closeMenu(false)
        break
      default:
        break
    }
  }

  const getItemClassName = (item: AppBarNavMenuItemConfig, index: number) =>
    mergeClasses(
      'hover:bg-dropdown-item-hover text-foreground flex w-full items-center justify-start px-4 py-3 transition-colors outline-none',
      item.className,
      item.mobileOnly && 'md:hidden',
      focusedIndex === index && 'bg-dropdown-item-selected'
    )

  const menuContent = (
    <nav id={menuId} role="menu" className="flex flex-col py-1" onClick={(e) => e.stopPropagation()} onKeyDown={isDesktop ? handleMenuKeyDown : undefined}>
      {visibleMenuItems.map((item, index) => (
        <AppBarNavMenuItem
          key={item.id}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          id={`${menuId}-item-${item.id}`}
          tabIndex={isDesktop ? (focusedIndex === index ? 0 : -1) : undefined}
          className={getItemClassName(item, index)}
          ariaLabel={item.ariaLabel}
          icon={item.icon}
          label={item.label}
          href={item.type === 'link' ? item.href : undefined}
          onClick={item.type === 'logout' ? handleLogout : () => closeMenu(false)}
        />
      ))}
    </nav>
  )

  const activeDescendantId =
    menuOpen && focusedIndex >= 0 && focusedIndex < visibleMenuItems.length ? `${menuId}-item-${visibleMenuItems[focusedIndex].id}` : undefined

  return (
    <>
      <div ref={triggerRef} className="relative shrink-0">
        {/* Desktop - Username Dropdown */}
        <ButtonBase
          ref={desktopTriggerRef}
          size="small"
          ariaLabel={`${username}, ${t('ButtonMenu')}`}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-haspopup="menu"
          aria-activedescendant={activeDescendantId}
          className="text-button-foreground hidden min-w-24 justify-between px-4 py-1 ps-3 pe-2 text-sm md:inline-flex"
          onClick={handleTriggerClick}
          onKeyDown={handleDesktopTriggerKeyDown}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="block truncate text-sm">{username}</span>
          <span className="material-symbols text-xl" aria-hidden="true">
            person
          </span>
        </ButtonBase>

        {/* Mobile - Hamburger Menu Button */}
        <IconBtn
          borderless
          ariaLabel={t('ButtonMenu')}
          aria-expanded={menuOpen}
          className="md:hidden"
          onClick={handleTriggerClick}
          onMouseDown={(e) => e.preventDefault()}
        >
          menu
        </IconBtn>
      </div>

      {menuOpen &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="bg-primary border-border z-[9999] min-w-[200px] rounded-md border shadow-lg"
            style={floatingStyles}
            onClick={(e) => e.stopPropagation()}
          >
            {menuContent}
          </div>,
          document.body
        )}
    </>
  )
}
