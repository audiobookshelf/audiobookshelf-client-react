'use client'

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { CSSTransition } from 'react-transition-group'
import '@/assets/transitions.css'
import { mergeClasses } from '@/lib/merge-classes'

export interface ContextMenuDropdownSubitem {
  text: string
  action: string
  data?: Record<string, any>
}

export interface ContextMenuDropdownItem {
  text: string
  action: string
  subitems?: ContextMenuDropdownSubitem[]
}

interface ContextMenuDropdownProps {
  items?: ContextMenuDropdownItem[]
  iconClass?: string
  menuWidth?: number
  processing?: boolean
  onAction?: (params: { action: string; data?: Record<string, any> }) => void
  menuAlign?: 'right' | 'left'
  autoWidth?: boolean
  disabled?: boolean
  className?: string
}

/**
 * A dropdown menu component that displays a list of items with associated actions and subitems.
 * The menu is displayed below the button when the button is clicked.
 * The menu can be aligned to the right or left of the button.
 */
export default function ContextMenuDropdown({
  items = [],
  iconClass = '',
  menuWidth = 96,
  processing = false,
  onAction,
  menuAlign = 'right',
  autoWidth = false,
  disabled = false,
  className
}: ContextMenuDropdownProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isOverSubItemMenu, setIsOverSubItemMenu] = useState(false)
  const [openSubMenuLeft, setOpenSubMenuLeft] = useState(false)
  const menuWrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [openSubMenuIndex, setOpenSubMenuIndex] = useState<number | null>(null)
  const submenuWidth = useMemo(() => autoWidth ? undefined : menuWidth, [autoWidth, menuWidth])
  const [menuActualWidth, setMenuActualWidth] = useState(menuWidth)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [focusedSubIndex, setFocusedSubIndex] = useState(-1)

  // Generate unique ID for this dropdown instance
  //const dropdownId = useMemo(() => `context-menu-${Math.random().toString(36).substring(2, 11)}`, [])
  const dropdownId = useId()

  // Helper functions to manage menu state
  const openMenu = useCallback((index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
    setFocusedSubIndex(-1)
    setOpenSubMenuIndex(null)
    console.log('openMenu', index)
  }, [])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(-1)
    setFocusedSubIndex(-1)
    setOpenSubMenuIndex(null)
  }, [])

  const openSubMenu = useCallback((index: number) => {
    setOpenSubMenuIndex(index)
    setFocusedSubIndex(0)
  }, [])

  const closeSubMenu = useCallback(() => {
    setOpenSubMenuIndex(null)
    setFocusedSubIndex(-1)
  }, [])

  const handleClickOutside = useCallback(() => {
    closeMenu()
  }, [closeMenu])

  useClickOutside(menuWrapperRef, buttonRef, handleClickOutside)

  const toggleMenu = useCallback(() => {
    if (disabled) return
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [disabled, showMenu, closeMenu, openMenu])

  useEffect(() => {
    if (showMenu && menuWrapperRef.current) {
      const boundingRect = menuWrapperRef.current.getBoundingClientRect()
      if (boundingRect) {
        const actualWidth = autoWidth ? boundingRect.width : menuWidth
        setMenuActualWidth(actualWidth)
        setOpenSubMenuLeft(window.innerWidth - boundingRect.x < actualWidth + (submenuWidth || menuWidth) + 5)
      }
    }
  }, [showMenu, menuWidth, autoWidth, submenuWidth])

  const handleMouseoverSubItemMenu = useCallback((index: number) => {
    setIsOverSubItemMenu(true)
  }, [])

  const handleMouseleaveSubItemMenu = useCallback((index: number) => {
    setIsOverSubItemMenu(false)
  }, [])

  const handleMouseoverItem = useCallback((index: number) => {
    setOpenSubMenuIndex(index)
  }, [])

  const handleMouseleaveItem = useCallback((index: number) => {
    // Wait a bit until openSubMenuIndex and isOverSubItemMenu are updated by other events
    setTimeout(() => {
      setIsOverSubItemMenu((currentIsOverSubItemMenu) => {
        // Using currentIsOverSubItemMenu due to stale closure issue
        if (openSubMenuIndex === index && !currentIsOverSubItemMenu) {
          setOpenSubMenuIndex(null)
        }
        return currentIsOverSubItemMenu
      })
    }, 10)
  }, [openSubMenuIndex])

  const handleAction = useCallback((action: string, data?: Record<string, any>) => {
    if (disabled) return
    closeMenu()
    onAction?.({ action, data })
  }, [disabled, onAction, closeMenu])

  const toggleSubmenu = useCallback((index: number) => {
    if (openSubMenuIndex === index) {
      closeSubMenu()
    } else {
      openSubMenu(index)
    }
  }, [openSubMenuIndex, closeSubMenu, openSubMenu])

  const handleToggleSubmenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSubmenu(index)
  }, [toggleSubmenu])

  const submenuLeftPos = useMemo(() => 
    openSubMenuLeft ? -(submenuWidth || menuWidth) + 1 : menuActualWidth - 0.5, 
    [openSubMenuLeft, submenuWidth, menuWidth, menuActualWidth]
  )

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMenu()
  }, [toggleMenu])

  const handleItemClick = useCallback((e: React.MouseEvent, action: string) => {
    e.stopPropagation()
    handleAction(action)
  }, [handleAction])

  const handleSubItemClick = useCallback((e: React.MouseEvent, action: string, data?: Record<string, any>) => {
    e.stopPropagation()
    handleAction(action, data)
  }, [handleAction])

  // Keyboard navigation handlers
  const handleVerticalNavigation = useCallback((direction: 'up' | 'down') => {
    if (direction === 'down') {
      if (!showMenu) {
        openMenu()
      } else if (focusedSubIndex !== -1 && openSubMenuIndex !== null) {
        const currentItem = items[openSubMenuIndex]
        if (currentItem?.subitems) {
          setFocusedSubIndex(prev => 
            prev < currentItem.subitems!.length - 1 ? prev + 1 : prev
          )
        }
      } else {
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : prev
        )
      }
    } else {
      console.log('openMenu up', showMenu)
      console.log('focusedIndex', focusedIndex)
      if (!showMenu) {
        console.log('openMenu', items.length - 1)
        openMenu(items.length - 1)
      } else if (focusedSubIndex !== -1 && openSubMenuIndex !== null) {
        setFocusedSubIndex(prev => prev > 0 ? prev - 1 : prev)
      } else {
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev)
      }
    }
  }, [showMenu, focusedSubIndex, openSubMenuIndex, items, openMenu])

  const handleHorizontalNavigation = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      if (showMenu && focusedSubIndex === -1 && focusedIndex >= 0) {
        const currentItem = items[focusedIndex]
        if (currentItem?.subitems) {
          openSubMenu(focusedIndex)
        }
      }
    } else {
      if (showMenu && focusedSubIndex !== -1) {
        closeSubMenu()
      }
    }
  }, [showMenu, focusedSubIndex, focusedIndex, items, openSubMenu, closeSubMenu])

  const handleEnterSpace = useCallback(() => {
    if (!showMenu) {
      openMenu()
    } else if (focusedSubIndex !== -1 && focusedSubIndex >= 0 && openSubMenuIndex !== null) {
      const currentItem = items[openSubMenuIndex]
      if (currentItem?.subitems) {
        const subitem = currentItem.subitems[focusedSubIndex]
        handleAction(subitem.action, subitem.data)
      }
    } else if (focusedIndex >= 0 && focusedIndex < items.length) {
      const currentItem = items[focusedIndex]
      if (currentItem?.subitems) {
        toggleSubmenu(focusedIndex)
      } else {
        handleAction(currentItem.action)
      }
    }
  }, [showMenu, focusedSubIndex, openSubMenuIndex, items, handleAction, toggleSubmenu, openMenu, focusedIndex])

  const handleHomeEnd = useCallback((key: 'home' | 'end') => {
    if (showMenu) {
      if (key === 'home') {
        if (focusedSubIndex !== -1) {
          setFocusedSubIndex(0)
        } else {
          setFocusedIndex(0)
        }
      } else {
        if (focusedSubIndex !== -1 && openSubMenuIndex !== null) {
          const currentItem = items[openSubMenuIndex]
          if (currentItem?.subitems) {
            setFocusedSubIndex(currentItem.subitems.length - 1)
          }
        } else {
          setFocusedIndex(items.length - 1)
        }
      }
    }
  }, [showMenu, focusedSubIndex, openSubMenuIndex, items])

  const handleTab = useCallback(() => {
    if (showMenu) {
      closeMenu()
    }
  }, [showMenu, closeMenu])

  const handleEscape = useCallback(() => {
    if (focusedSubIndex !== -1) {
      closeSubMenu()
    } else {
      closeMenu()
      buttonRef.current?.focus()
    }
  }, [focusedSubIndex, closeSubMenu, closeMenu])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [disabled, handleVerticalNavigation, handleHorizontalNavigation, handleEnterSpace, handleEscape, handleHomeEnd, handleTab])

  // Handle menu item keyboard events
  const handleItemKeyDown = useCallback((e: React.KeyboardEvent, action: string) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleAction(action)
        break
    }
  }, [handleAction])

  // Handle submenu item keyboard events
  const handleSubItemKeyDown = useCallback((e: React.KeyboardEvent, action: string, data?: Record<string, any>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleAction(action, data)
        break
    }
  }, [handleAction])

  const menuItems = 
    items.map((item, index) =>
      item.subitems ? (
        <div key={index}>
          <button
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openSubMenuIndex === index}
            aria-label={`${item.text}, submenu`}
            id={`${dropdownId}-item-${index}`}
            className={mergeClasses(
              'flex items-center px-2 py-1.5 hover:bg-white/5 text-white text-xs cursor-default w-full',
              openSubMenuIndex === index ? 'bg-white/5' : '',
              focusedIndex === index && focusedSubIndex === -1 ? 'bg-white/10' : ''
            )}
            onMouseOver={() => handleMouseoverItem(index)}
            onMouseLeave={() => handleMouseleaveItem(index)}
            onClick={(e) => handleToggleSubmenu(e, index)}
            onKeyDown={(e) => handleItemKeyDown(e, item.action)}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
          >
            <p>{item.text}</p>
          </button>
          {openSubMenuIndex === index && (
            <div
              cy-id="submenu"
              role="menu"
              aria-label={`${item.text} submenu`}
              onMouseOver={() => handleMouseoverSubItemMenu(index)}
              onMouseLeave={() => handleMouseleaveSubItemMenu(index)}
              className={mergeClasses(
                'absolute bg-bg border border-black-200 shadow-lg z-50 -ml-px py-1',
                openSubMenuLeft ? 'rounded-l-md' : 'rounded-r-md',
                'rounded-b-md',
                autoWidth ? 'inline-flex flex-col whitespace-nowrap' : ''
              )}
              style={{
                left: `${submenuLeftPos}px`,
                top: `${index * 28}px`, // index * (text-xs line-height + py-1.5)
                ...(autoWidth ? { minWidth: `${menuWidth}px` } : { width: `${submenuWidth}px` })
              }}
            >
              {item.subitems.map((subitem, subitemIndex) => (
                <button
                  key={`subitem-${subitemIndex}`}
                  role="menuitem"
                  aria-label={subitem.text}
                  id={`${dropdownId}-subitem-${index}-${subitemIndex}`}
                  className={mergeClasses(
                    'flex items-center px-2 py-1.5 hover:bg-white/5 text-white text-xs cursor-pointer w-full',
                    focusedSubIndex === subitemIndex && focusedSubIndex !== -1 ? 'bg-white/10' : ''
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => handleSubItemClick(e, subitem.action, subitem.data)}
                  onKeyDown={(e) => handleSubItemKeyDown(e, subitem.action, subitem.data)}
                  tabIndex={-1}
                >
                  <p>{subitem.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          key={index}
          role="menuitem"
          aria-label={item.text}
          id={`${dropdownId}-item-${index}`}
          className={mergeClasses(
            'flex items-center px-2 py-1.5 hover:bg-white/5 text-white text-xs cursor-pointer w-full',
            focusedIndex === index && focusedSubIndex === -1 ? 'bg-white/10' : ''
          )}
          onClick={(e) => handleItemClick(e, item.action)}
          onKeyDown={(e) => handleItemKeyDown(e, item.action)}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
        >
          <p className="text-left">{item.text}</p>
        </button>
      )
    )

  return (
    <div cy-id="wrapper" className={mergeClasses('relative h-9 w-9', className)}>
      {!processing ? (
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          className="relative h-full w-full flex items-center justify-center shadow-xs pl-3 pr-3 text-left cursor-pointer text-gray-100 hover:text-gray-200 rounded-full hover:bg-white/5"
          aria-label="More options"
          aria-haspopup="true"
          aria-expanded={showMenu}
          aria-controls={dropdownId}
          aria-activedescendant={
            focusedSubIndex !== -1 && focusedSubIndex >= 0 && openSubMenuIndex !== null 
              ? `${dropdownId}-subitem-${openSubMenuIndex}-${focusedSubIndex}`
              : focusedIndex >= 0 
                ? `${dropdownId}-item-${focusedIndex}` 
                : undefined
          }
          onClick={handleButtonClick}
          onKeyDown={handleKeyDown}
        >
          <span className={`material-symbols text-2xl ${iconClass}`}>&#xe5d4;</span>
        </button>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      <CSSTransition
        in={showMenu}
        timeout={{
          enter: 200,
          exit: 100
        }}
        nodeRef={menuWrapperRef}
        classNames="menu"
        unmountOnExit
      >
        <div
          ref={menuWrapperRef}
          id={dropdownId}
          role="menu"
          aria-label="Context menu"
          className={mergeClasses(
            'absolute mt-1 z-10 bg-bg border border-black-200 shadow-lg rounded-md py-1 focus:outline-hidden sm:text-sm',
            menuAlign === 'right' ? 'right-0' : 'left-0',
            autoWidth ? 'inline-flex flex-col whitespace-nowrap' : ''
          )}
          style={autoWidth ? { minWidth: `${menuWidth}px` } : { width: `${menuWidth}px` }}
        >
          {menuItems}
        </div>
      </CSSTransition>
    </div>
  )
} 