'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

export interface ContextMenuSubitem<T = string> {
  text: string
  action: string
  data?: Record<string, T>
}

export interface ContextMenuItem<T = string> {
  text: string
  action: string
  subitems?: ContextMenuSubitem<T>[]
}

interface ContextMenuProps<T = string> {
  items: ContextMenuItem<T>[]
  isOpen: boolean
  menuWidth?: number
  menuAlign?: 'right' | 'left'
  autoWidth?: boolean
  className?: string
  ref: React.RefObject<HTMLDivElement | null>
  menuId: string
  // Keyboard navigation props
  focusedIndex?: number
  focusedSubIndex?: number
  openSubmenuIndex?: number | null
  onOpenSubmenu?: (index: number) => void
  onCloseSubmenu?: () => void
  onItemClick?: (action: string, data?: Record<string, T>) => void
  onSubItemClick?: (action: string, data?: Record<string, T>) => void
}

/**
 * A context menu component that displays a list of items with associated actions and subitems.
 * The menu can be aligned to the right or left and supports keyboard navigation.
 */
export default function ContextMenu<T = string>({
  items,
  isOpen,
  menuWidth = 96,
  menuAlign = 'right',
  autoWidth = false,
  className,
  ref,
  menuId,
  focusedIndex = -1,
  focusedSubIndex = -1,
  openSubmenuIndex: openSubmenuIndex = null,
  onOpenSubmenu,
  onCloseSubmenu,
  onItemClick,
  onSubItemClick
}: ContextMenuProps<T>) {
  const t = useTypeSafeTranslations()
  // Track whether we're hovering over an open submenu
  const [isOverSubmenu, setIsOverSubmenu] = useState(false)
  // Track which parent index we're hovering over
  const [isOverParentIndex, setIsOverParentIndex] = useState(-1)
  // Track whether the submenu is open on the left or right side of the parent
  const [openSubmenuLeft, setOpenSubmenuLeft] = useState(false)
  const submenuWidth = useMemo(() => (autoWidth ? undefined : menuWidth), [autoWidth, menuWidth])
  // Track the actual width of the menu
  const [menuActualWidth, setMenuActualWidth] = useState(menuWidth)

  // Track which submenu index is pending closure after mouse leave
  const pendingCloseRef = useRef<number | null>(null)

  const handleMouseoverSubmenu = useCallback(() => {
    setIsOverSubmenu(true)
  }, [])

  const handleMouseleaveSubmenu = useCallback(() => {
    setIsOverSubmenu(false)
    // Mark for potential closure when leaving submenu
    pendingCloseRef.current = openSubmenuIndex
  }, [openSubmenuIndex])

  const handleMouseoverParent = useCallback(
    (index: number) => {
      setIsOverParentIndex(index)
      onOpenSubmenu?.(index)
    },
    [onOpenSubmenu]
  )

  useLayoutEffect(() => {
    if (pendingCloseRef.current !== null) {
      // Only close the submenu if:
      // 1. The pending index matches the currently open submenu
      // 2. The user is not hovering over the submenu
      // 3. The user is not hovering over the parent menu item
      if (openSubmenuIndex === pendingCloseRef.current && !isOverSubmenu && isOverParentIndex !== openSubmenuIndex) {
        onCloseSubmenu?.()
      }
      pendingCloseRef.current = null
    }
  }, [openSubmenuIndex, onCloseSubmenu, isOverSubmenu, isOverParentIndex])

  const handleMouseleaveParent = useCallback((index: number) => {
    setIsOverParentIndex(-1)
    // When leaving a submenu parent, mark the submenu for potential closure
    pendingCloseRef.current = index
  }, [])

  const handleToggleSubmenu = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault()
      e.stopPropagation()
      if (openSubmenuIndex === index) {
        onCloseSubmenu?.()
      } else {
        onOpenSubmenu?.(index)
      }
    },
    [onOpenSubmenu, onCloseSubmenu, openSubmenuIndex]
  )

  const submenuLeftPos = useMemo(
    () => (openSubmenuLeft ? -(submenuWidth || menuWidth) + 1 : menuActualWidth - 0.5),
    [openSubmenuLeft, submenuWidth, menuWidth, menuActualWidth]
  )

  useEffect(() => {
    if (isOpen && ref.current) {
      const boundingRect = ref.current.getBoundingClientRect()
      if (boundingRect) {
        const actualWidth = autoWidth ? boundingRect.width : menuWidth
        setMenuActualWidth(actualWidth)
        setOpenSubmenuLeft(window.innerWidth - boundingRect.x < actualWidth + (submenuWidth || menuWidth) + 5)
      }
    }
  }, [isOpen, menuWidth, autoWidth, submenuWidth, ref])

  const menuItems = items.map((item, index) =>
    item.subitems ? (
      <div key={index}>
        <button
          cy-id="parent-item"
          role="menuitem"
          aria-haspopup="true"
          aria-expanded={openSubmenuIndex === index}
          aria-label={`${item.text}, submenu`}
          id={`${menuId}-item-${index}`}
          className={mergeClasses(
            'flex items-center px-2 py-1.5 hover:bg-foreground/5 text-foreground text-xs cursor-default w-full',
            openSubmenuIndex === index ? 'bg-foreground/5' : '',
            focusedIndex === index && focusedSubIndex === -1 ? 'bg-foreground/10' : ''
          )}
          onMouseOver={() => handleMouseoverParent(index)}
          onMouseLeave={() => handleMouseleaveParent(index)}
          onClick={(e) => handleToggleSubmenu(e, index)}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
        >
          <p>{item.text}</p>
        </button>
        {openSubmenuIndex === index && (
          <div
            cy-id={`submenu-${index}`}
            role="menu"
            aria-label={`${item.text} submenu`}
            onMouseOver={handleMouseoverSubmenu}
            onMouseLeave={handleMouseleaveSubmenu}
            className={mergeClasses(
              'absolute bg-bg border border-black-200 shadow-lg z-50 -ms-px py-1',
              openSubmenuLeft ? 'rounded-s-md' : 'rounded-e-md',
              'rounded-b-md',
              autoWidth ? 'inline-flex flex-col whitespace-nowrap' : ''
            )}
            style={{
              left: `${submenuLeftPos}px`,
              top: `${index * 28}px`, // index * (text-xs line-height + py-1.5)
              ...(autoWidth ? { minWidth: `${menuWidth}px` } : { width: `${submenuWidth}px` })
            }}
          >
            {item.subitems.length > 0 ? (
              item.subitems.map((subitem, subitemIndex) => (
                <button
                  cy-id="action-subitem"
                  key={`subitem-${subitemIndex}`}
                  role="menuitem"
                  aria-label={subitem.text}
                  id={`${menuId}-subitem-${index}-${subitemIndex}`}
                  className={mergeClasses(
                    'flex items-center px-2 py-1.5 hover:bg-foreground/5 text-foreground text-xs cursor-pointer w-full',
                    focusedSubIndex === subitemIndex && focusedSubIndex !== -1 ? 'bg-foreground/10' : ''
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSubItemClick?.(subitem.action, subitem.data)
                  }}
                  tabIndex={-1}
                >
                  <p>{subitem.text}</p>
                </button>
              ))
            ) : (
              <button
                cy-id="no-items-subitem"
                role="menuitem"
                aria-label={t('LabelNoItems')}
                id={`${menuId}-subitem-${index}-no-items`}
                className="flex items-center px-2 py-1.5 text-disabled text-xs cursor-default w-full"
                disabled
                tabIndex={-1}
              >
                <p>{t('LabelNoItems')}</p>
              </button>
            )}
          </div>
        )}
      </div>
    ) : (
      <button
        cy-id="action-item"
        key={index}
        role="menuitem"
        aria-label={item.text}
        id={`${menuId}-item-${index}`}
        className={mergeClasses(
          'flex items-center px-2 py-1.5 hover:bg-foreground/5 text-foreground text-xs cursor-pointer w-full',
          focusedIndex === index && focusedSubIndex === -1 ? 'bg-foreground/10' : ''
        )}
        onClick={(e) => {
          e.stopPropagation()
          onItemClick?.(item.action)
        }}
        onMouseDown={(e) => e.preventDefault()}
        tabIndex={-1}
      >
        <p className="text-left">{item.text}</p>
      </button>
    )
  )

  return (
    <>
      {isOpen && (
        <div
          cy-id="menu"
          ref={ref}
          id={menuId}
          role="menu"
          aria-label={t('LabelContextMenu')}
          className={mergeClasses(
            'absolute mt-1 z-10 bg-bg border border-black-200 shadow-lg rounded-md py-1 focus:outline-hidden sm:text-sm',
            menuAlign === 'right' ? 'end-0' : 'start-0',
            autoWidth ? 'inline-flex flex-col whitespace-nowrap' : '',
            className
          )}
          style={autoWidth ? { minWidth: `${menuWidth}px` } : { width: `${menuWidth}px` }}
        >
          {menuItems}
        </div>
      )}
    </>
  )
}
