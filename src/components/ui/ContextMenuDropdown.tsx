'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { CSSTransition } from 'react-transition-group'
import '@/assets/transitions.css'
import { mergeClasses } from '@/lib/merge-classes'

interface ContextMenuDropdownSubitem {
  text: string
  action: string
  data?: Record<string, any>
}

interface ContextMenuDropdownItem {
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

  const handleClickOutside = useCallback(() => {
    setOpenSubMenuIndex(null)
    setShowMenu(false)
  }, [])

  useClickOutside(menuWrapperRef, buttonRef, handleClickOutside)

  const handleShowMenu = useCallback(() => {
    if (disabled) return
    setShowMenu(!showMenu)
  }, [disabled, showMenu])

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
    setShowMenu(false)
    onAction?.({ action, data })
  }, [disabled, onAction])

  const toggleSubmenu = useCallback((index: number) => {
    if (openSubMenuIndex === index) {
      setOpenSubMenuIndex(null)
    } else {
      setOpenSubMenuIndex(index)
    }
  }, [openSubMenuIndex])

  const submenuLeftPos = useMemo(() => 
    openSubMenuLeft ? -(submenuWidth || menuWidth) + 1 : menuActualWidth - 0.5, 
    [openSubMenuLeft, submenuWidth, menuWidth, menuActualWidth]
  )

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleShowMenu()
  }, [handleShowMenu])

  const handleItemClick = useCallback((e: React.MouseEvent, action: string, data?: Record<string, any>) => {
    e.stopPropagation()
    handleAction(action, data)
  }, [handleAction])

  const handleSubItemClick = useCallback((e: React.MouseEvent, action: string, data?: Record<string, any>) => {
    e.stopPropagation()
    handleAction(action, data)
  }, [handleAction])

  const menuItems = useMemo(() => 
    items.map((item, index) =>
      item.subitems ? (
        <div key={index}>
          <button
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openSubMenuIndex === index}
            aria-label={`${item.text}, submenu`}
            className={`flex items-center px-2 py-1.5 hover:bg-white/5 text-white text-xs cursor-default w-full ${openSubMenuIndex === index ? 'bg-white/5' : ''}`}
            onMouseOver={() => handleMouseoverItem(index)}
            onMouseLeave={() => handleMouseleaveItem(index)}
            onClick={() => toggleSubmenu(index)}
          >
            <p>{item.text}</p>
          </button>
          {openSubMenuIndex === index && (
            <div
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
                top: `${index * 28}px`,
                ...(autoWidth ? { minWidth: `${menuWidth}px` } : { width: `${submenuWidth}px` })
              }}
            >
              {item.subitems.map((subitem, subitemIndex) => (
                <button
                  key={`subitem-${subitemIndex}`}
                  role="menuitem"
                  aria-label={subitem.text}
                  className="flex items-center px-2 py-1.5 hover:bg-white/5 text-white text-xs cursor-pointer w-full"
                  onClick={(e) => handleSubItemClick(e, subitem.action, subitem.data)}
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
          className="flex items-center px-2 py-1.5 hover:bg-white/5 text-white text-xs cursor-pointer w-full"
          onClick={(e) => handleItemClick(e, item.action)}
        >
          <p className="text-left">{item.text}</p>
        </button>
      )
    ), 
    [items, openSubMenuIndex, openSubMenuLeft, submenuLeftPos, autoWidth, menuWidth, submenuWidth, handleMouseoverItem, handleMouseleaveItem, toggleSubmenu, handleItemClick, handleSubItemClick, handleMouseoverSubItemMenu, handleMouseleaveSubItemMenu]
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
          aria-controls="context-menu"
          onClick={handleButtonClick}
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
          id="context-menu"
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