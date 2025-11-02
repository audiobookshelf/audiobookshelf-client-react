'use client'

import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import ContextMenu, { ContextMenuItem } from './ContextMenu'
import IconBtn from './IconBtn'

export interface ContextMenuDropdownSubitem<T = string> {
  text: string
  action: string
  data?: Record<string, T>
}

export interface ContextMenuDropdownItem<T = string> {
  text: string
  action: string
  subitems?: ContextMenuDropdownSubitem<T>[]
}

interface ContextMenuDropdownProps<T = string> {
  items?: ContextMenuDropdownItem<T>[]
  iconClass?: string
  menuWidth?: number
  processing?: boolean
  onAction?: (params: { action: string; data?: Record<string, T> }) => void
  menuAlign?: 'right' | 'left'
  autoWidth?: boolean
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  borderless?: boolean
  className?: string
  usePortal?: boolean
}

/**
 * A dropdown menu component that displays a list of items with associated actions and subitems.
 * The menu is displayed below the button when the button is clicked.
 * The menu can be aligned to the right or left of the button.
 */
export default function ContextMenuDropdown<T = string>({
  items = [],
  iconClass = '',
  menuWidth = 96,
  processing = false,
  onAction,
  menuAlign = 'right',
  autoWidth = false,
  disabled = false,
  size = 'medium',
  borderless = false,
  className,
  usePortal = false
}: ContextMenuDropdownProps<T>) {
  const t = useTypeSafeTranslations()
  const [showMenu, setShowMenu] = useState(false)
  const menuWrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [focusedSubIndex, setFocusedSubIndex] = useState(-1)

  // Generate unique ID for this dropdown instance
  const dropdownId = useId()

  // Helper functions to manage menu state
  const openMenu = useCallback((index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
    setFocusedSubIndex(-1)
    setOpenSubmenuIndex(null)
  }, [])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(-1)
    setFocusedSubIndex(-1)
    setOpenSubmenuIndex(null)
  }, [])

  // Handle click outside to close menu
  useClickOutside(menuWrapperRef, buttonRef, closeMenu)

  const openSubMenu = useCallback(
    (index: number) => {
      const currentItem = items[index]
      setOpenSubmenuIndex(index)
      // Only set focusedSubIndex to 0 if there are actual subitems
      if (currentItem?.subitems && currentItem.subitems.length > 0) {
        setFocusedSubIndex(0)
      } else {
        setFocusedSubIndex(-1)
      }
    },
    [items]
  )

  const closeSubMenu = useCallback(() => {
    setOpenSubmenuIndex(null)
    setFocusedSubIndex(-1)
  }, [])

  const toggleMenu = useCallback(() => {
    if (disabled) return
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [disabled, showMenu, closeMenu, openMenu])

  const handleAction = useCallback(
    (action: string, data?: Record<string, T>) => {
      if (disabled) return
      closeMenu()
      onAction?.({ action, data })
    },
    [disabled, onAction, closeMenu]
  )

  const toggleSubmenu = useCallback(
    (index: number) => {
      if (openSubmenuIndex === index) {
        closeSubMenu()
      } else {
        openSubMenu(index)
      }
    },
    [openSubmenuIndex, closeSubMenu, openSubMenu]
  )

  const handleItemClick = useCallback(
    (action: string) => {
      handleAction(action)
    },
    [handleAction]
  )

  const handleSubItemClick = useCallback(
    (action: string, data?: Record<string, T>) => {
      handleAction(action, data)
    },
    [handleAction]
  )

  // Keyboard navigation handlers
  const handleVerticalNavigation = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'down') {
        if (!showMenu) {
          openMenu()
        } else if (focusedSubIndex !== -1 && openSubmenuIndex !== null) {
          const currentItem = items[openSubmenuIndex]
          if (currentItem?.subitems && currentItem.subitems.length > 0) {
            setFocusedSubIndex((prev) => (prev < currentItem.subitems!.length - 1 ? prev + 1 : prev))
          }
        } else {
          closeSubMenu()
          setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev))
        }
      } else {
        if (!showMenu) {
          openMenu(items.length - 1)
        } else if (focusedSubIndex !== -1 && openSubmenuIndex !== null) {
          const currentItem = items[openSubmenuIndex]
          if (currentItem?.subitems && currentItem.subitems.length > 0) {
            setFocusedSubIndex((prev) => (prev > 0 ? prev - 1 : prev))
          }
        } else {
          closeSubMenu()
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
      }
    },
    [showMenu, focusedSubIndex, openSubmenuIndex, items, openMenu, closeSubMenu]
  )

  const handleHorizontalNavigation = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        if (showMenu && focusedSubIndex === -1 && focusedIndex >= 0) {
          const currentItem = items[focusedIndex]
          if (currentItem?.subitems) {
            openSubMenu(focusedIndex)
          }
        }
      } else {
        if (showMenu) {
          closeSubMenu()
        }
      }
    },
    [showMenu, focusedSubIndex, focusedIndex, items, openSubMenu, closeSubMenu]
  )

  const handleEnterSpace = useCallback(() => {
    if (!showMenu) {
      openMenu()
    } else if (focusedSubIndex !== -1 && focusedSubIndex >= 0 && openSubmenuIndex !== null) {
      const currentItem = items[openSubmenuIndex]
      if (currentItem?.subitems && currentItem.subitems.length > 0) {
        const subitem = currentItem.subitems[focusedSubIndex]
        if (subitem) {
          handleAction(subitem.action, subitem.data)
        }
      }
    } else if (focusedIndex >= 0 && focusedIndex < items.length) {
      const currentItem = items[focusedIndex]
      if (currentItem?.subitems) {
        toggleSubmenu(focusedIndex)
      } else {
        handleAction(currentItem.action)
      }
    }
  }, [showMenu, focusedSubIndex, openSubmenuIndex, items, handleAction, toggleSubmenu, openMenu, focusedIndex])

  const handleHomeEnd = useCallback(
    (key: 'home' | 'end') => {
      if (showMenu) {
        if (key === 'home') {
          if (focusedSubIndex !== -1) {
            setFocusedSubIndex(0)
          } else {
            closeSubMenu()
            setFocusedIndex(0)
          }
        } else {
          if (focusedSubIndex !== -1 && openSubmenuIndex !== null) {
            const currentItem = items[openSubmenuIndex]
            if (currentItem?.subitems && currentItem.subitems.length > 0) {
              setFocusedSubIndex(currentItem.subitems.length - 1)
            }
          } else {
            closeSubMenu()
            setFocusedIndex(items.length - 1)
          }
        }
      }
    },
    [showMenu, focusedSubIndex, openSubmenuIndex, items, closeSubMenu]
  )

  const handleTab = useCallback(() => {
    if (showMenu) {
      closeMenu()
    }
  }, [showMenu, closeMenu])

  const handleEscape = useCallback(() => {
    if (openSubmenuIndex !== null) {
      closeSubMenu()
    } else {
      closeMenu()
      buttonRef.current?.focus()
    }
  }, [openSubmenuIndex, closeSubMenu, closeMenu])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (disabled) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          handleVerticalNavigation('down')
          break

        case 'ArrowUp':
          e.preventDefault()
          handleVerticalNavigation('up')
          break

        case 'ArrowRight':
          e.preventDefault()
          handleHorizontalNavigation('right')
          break

        case 'ArrowLeft':
          e.preventDefault()
          handleHorizontalNavigation('left')
          break

        case 'Enter':
        case ' ':
          e.preventDefault()
          handleEnterSpace()
          break

        case 'Escape':
          e.preventDefault()
          handleEscape()
          break

        case 'Home':
          e.preventDefault()
          handleHomeEnd('home')
          break

        case 'End':
          e.preventDefault()
          handleHomeEnd('end')
          break

        case 'Tab':
          handleTab()
          break
      }
    },
    [disabled, handleVerticalNavigation, handleHorizontalNavigation, handleEnterSpace, handleEscape, handleHomeEnd, handleTab]
  )

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleMenu()
    },
    [toggleMenu]
  )

  // Convert items to the format expected by ContextMenu
  const contextMenuItems: ContextMenuItem<T>[] = items.map((item) => ({
    text: item.text,
    action: item.action,
    subitems: item.subitems?.map((subitem) => ({
      text: subitem.text,
      action: subitem.action,
      data: subitem.data as Record<string, T>
    }))
  }))

  const buttonClass = useMemo(() => {
    return mergeClasses(size === 'small' ? 'w-9' : size === 'large' ? 'w-11' : 'w-10', className)
  }, [size, className])

  return (
    <div cy-id="wrapper" className={mergeClasses('relative', className)}>
      {!processing ? (
        <IconBtn
          ref={buttonRef}
          size={size}
          borderless={borderless}
          iconClass={iconClass}
          disabled={disabled}
          className={buttonClass}
          ariaLabel={t('LabelMoreOptions')}
          aria-haspopup="true"
          aria-expanded={showMenu}
          aria-controls={dropdownId}
          aria-activedescendant={
            focusedSubIndex !== -1 && focusedSubIndex >= 0 && openSubmenuIndex !== null
              ? `${dropdownId}-subitem-${openSubmenuIndex}-${focusedSubIndex}`
              : focusedIndex >= 0
                ? `${dropdownId}-item-${focusedIndex}`
                : undefined
          }
          onClick={handleButtonClick}
          onKeyDown={handleKeyDown}
        >
          more_vert
        </IconBtn>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      <ContextMenu
        ref={menuWrapperRef}
        menuId={dropdownId}
        items={contextMenuItems}
        isOpen={showMenu}
        menuWidth={menuWidth}
        menuAlign={menuAlign}
        autoWidth={autoWidth}
        focusedIndex={focusedIndex}
        focusedSubIndex={focusedSubIndex}
        openSubmenuIndex={openSubmenuIndex}
        onOpenSubmenu={(index) => {
          setOpenSubmenuIndex(index)
        }}
        onCloseSubmenu={() => setOpenSubmenuIndex(null)}
        onItemClick={handleItemClick}
        onSubItemClick={handleSubItemClick}
        usePortal={usePortal}
        triggerRef={buttonRef as React.RefObject<HTMLElement>}
      />
    </div>
  )
}
