'use client'

import { useModalRef } from '@/contexts/ModalContext'
import { useMenuPosition } from '@/hooks/useMenuPosition'
import { useScrollToFocused } from '@/hooks/useScrollToFocused'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownMenuSubitem {
  text: string
  value: string | number
}

export interface DropdownMenuItem {
  text: string
  value: string | number
  subtext?: string
  keepOpen?: boolean
  rightIcon?: React.ReactNode
  subitems?: DropdownMenuSubitem[]
}

/**
 * Submenu component that handles viewport-aware height limiting.
 * Limits height so submenu doesn't overflow beyond the bottom of the viewport.
 */
function DropdownSubmenu({
  subitems,
  dropdownId,
  parentIndex,
  focusedSubIndex,
  onSubitemClick,
  onMouseOver,
  onMouseLeave,
  openLeft,
  submenuWidth,
  filterText,
  t
}: {
  subitems: DropdownMenuSubitem[]
  dropdownId: string
  parentIndex: number
  focusedSubIndex: number
  onSubitemClick?: (subitem: DropdownMenuSubitem) => void
  onMouseOver: () => void
  onMouseLeave: () => void
  openLeft: boolean
  submenuWidth: number
  filterText: string
  t: ReturnType<typeof useTypeSafeTranslations>
}) {
  const submenuRef = useRef<HTMLUListElement>(null)
  const [calculatedMaxHeight, setCalculatedMaxHeight] = useState<string>('none')

  // Filter subitems based on filter text (case-insensitive starts-with matching)
  const filteredSubitems = useMemo(() => {
    if (!filterText) return subitems
    return subitems.filter((subitem) => subitem.text.toLowerCase().startsWith(filterText.toLowerCase()))
  }, [subitems, filterText])

  // Scroll focused subitem into view during keyboard navigation
  useScrollToFocused({
    containerRef: submenuRef,
    focusedIndex: focusedSubIndex,
    active: focusedSubIndex >= 0,
    getElement: useCallback(
      (container, index) => container.querySelector(`#${dropdownId}-subitem-${parentIndex}-${index}`) as HTMLElement,
      [dropdownId, parentIndex]
    )
  })

  // Calculate maxHeight to not overflow beyond viewport bottom
  useLayoutEffect(() => {
    if (submenuRef.current) {
      const rect = submenuRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      // Calculate available height from top of submenu to bottom of viewport (with 10px padding)
      const availableHeight = viewportHeight - rect.top - 10
      // Only set if content would overflow
      if (rect.height > availableHeight) {
        setCalculatedMaxHeight(`${Math.max(availableHeight, 100)}px`)
      }
    }
  }, [filteredSubitems])

  return (
    <ul
      ref={submenuRef}
      role="menu"
      className={mergeClasses(
        'absolute bg-primary border border-dropdown-menu-border shadow-lg z-50 py-1 rounded-md',
        openLeft ? 'rounded-s-md' : 'rounded-e-md',
        'overflow-y-auto'
      )}
      style={{
        left: openLeft ? `${-submenuWidth + 1}px` : '100%',
        top: '0',
        width: `${submenuWidth}px`,
        maxHeight: calculatedMaxHeight
      }}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {filterText && (
        <li className="text-foreground-subdued select-none relative px-3 py-1 text-xs border-b border-dropdown-menu-border mb-1" role="presentation">
          <span className="font-mono">{filterText}</span>
        </li>
      )}
      {filteredSubitems.map((subitem, subitemIndex) => (
        <li
          key={subitem.value}
          id={`${dropdownId}-subitem-${parentIndex}-${subitemIndex}`}
          className={mergeClasses(
            'text-foreground relative py-2 cursor-pointer hover:bg-dropdown-item-hover',
            focusedSubIndex === subitemIndex ? 'bg-dropdown-item-selected' : ''
          )}
          role="option"
          tabIndex={-1}
          aria-selected={focusedSubIndex === subitemIndex}
          onClick={(e) => {
            e.stopPropagation()
            onSubitemClick?.(subitem)
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center">
            <span className="ms-3 block truncate font-sans text-sm">{subitem.text}</span>
          </div>
        </li>
      ))}
      {filteredSubitems.length === 0 && (
        <li className="text-foreground-subdued select-none relative py-2" role="option" aria-selected={false}>
          <div className="flex items-center justify-center">
            <span className="font-normal text-sm">{t('LabelNoItems')}</span>
          </div>
        </li>
      )}
    </ul>
  )
}

interface DropdownMenuProps {
  showMenu: boolean
  items: DropdownMenuItem[]
  multiSelect?: boolean
  focusedIndex: number
  focusedSubIndex?: number
  openSubmenuIndex?: number | null
  dropdownId: string
  onItemClick?: (item: DropdownMenuItem) => void
  onSubitemClick?: (subitem: DropdownMenuSubitem) => void
  onOpenSubmenu?: (index: number) => void
  onCloseSubmenu?: () => void
  isItemSelected?: (item: DropdownMenuItem) => boolean
  showSelectedIndicator?: boolean
  showNoItemsMessage?: boolean
  noItemsText?: string
  menuMaxHeight?: string
  className?: string
  ref?: React.RefObject<HTMLUListElement | null>
  usePortal?: boolean
  triggerRef?: React.RefObject<HTMLElement>
  highlightSelected?: boolean
  submenuFilterText?: string
}

/**
 * A reusable dropdown menu component that provides consistent styling and behavior
 * for dropdown menus across the application. Supports two-level submenus.
 */
export default function DropdownMenu({
  showMenu,
  items,
  multiSelect = false,
  focusedIndex,
  focusedSubIndex = -1,
  openSubmenuIndex = null,
  dropdownId,
  onItemClick,
  onSubitemClick,
  onOpenSubmenu,
  onCloseSubmenu,
  isItemSelected,
  showSelectedIndicator = false,
  showNoItemsMessage = false,
  noItemsText,
  menuMaxHeight = '224px',
  className,
  ref: externalRef,
  usePortal: usePortalProp = false,
  triggerRef,
  highlightSelected = false,
  submenuFilterText = ''
}: DropdownMenuProps) {
  const t = useTypeSafeTranslations()
  const defaultNoItemsText = noItemsText || t('LabelNoItems')
  const modalRef = useModalRef()
  const portalContainerRef = modalRef || undefined
  const internalRef = useRef<HTMLUListElement>(null)
  const menuRef = externalRef || internalRef
  const [menuPosition, setMenuPosition] = useState<{ top: string; left: string; width: string }>({
    top: '0px',
    left: '0px',
    width: 'auto'
  })
  const [isMouseOver, setIsMouseOver] = useState(false)

  // Track whether we're hovering over an open submenu
  const [isOverSubmenu, setIsOverSubmenu] = useState(false)
  // Track which parent index we're hovering over
  const [isOverParentIndex, setIsOverParentIndex] = useState(-1)
  // Track whether the submenu should open on the left
  const [openSubmenuLeft, setOpenSubmenuLeft] = useState(false)
  // Track pending submenu closure
  const pendingCloseRef = useRef<number | null>(null)

  const submenuWidth = 192 // Fixed submenu width

  // Use portal if it is explicitly enabled or if the modalRef is not null
  // For the portal to work, triggerRef must be provided
  const usePortal: boolean = (usePortalProp || modalRef !== null) && triggerRef !== undefined

  // Use the menu position hook when portal is enabled
  useMenuPosition({
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    menuRef: menuRef as React.RefObject<HTMLElement>,
    isOpen: showMenu,
    onPositionChange: setMenuPosition,
    disable: !usePortal,
    portalContainerRef
  })

  // Scroll focused item into view
  useScrollToFocused({
    containerRef: menuRef,
    focusedIndex,
    active: showMenu,
    getElement: useCallback((container, index) => container.querySelector(`#${dropdownId}-item-${index}`) as HTMLElement, [dropdownId])
  })

  // Update submenu position when menu opens
  useEffect(() => {
    if (showMenu && menuRef.current) {
      const boundingRect = menuRef.current.getBoundingClientRect()
      if (boundingRect) {
        setOpenSubmenuLeft(window.innerWidth - boundingRect.x < boundingRect.width + submenuWidth + 5)
      }
    }
  }, [showMenu, menuRef])

  // Handle pending submenu closure
  useLayoutEffect(() => {
    if (pendingCloseRef.current !== null) {
      if (openSubmenuIndex === pendingCloseRef.current && !isOverSubmenu && isOverParentIndex !== openSubmenuIndex) {
        onCloseSubmenu?.()
      }
      pendingCloseRef.current = null
    }
  }, [openSubmenuIndex, onCloseSubmenu, isOverSubmenu, isOverParentIndex])

  // Add global wheel event listener for quicker catching of mouse wheel events
  useEffect(() => {
    if (!showMenu || !isMouseOver) return

    const handleGlobalWheel = (e: WheelEvent) => {
      // Check if the mouse is over the dropdown menu
      if (menuRef?.current && menuRef.current.contains(e.target as Node)) {
        // Check if the target is inside a submenu (role="menu" inside the main menu)
        const target = e.target as HTMLElement
        const submenu = target.closest('[role="menu"]')

        if (submenu && submenu !== menuRef.current) {
          // Target is in a submenu - let the submenu handle scrolling
          e.stopPropagation()
          e.preventDefault()
          submenu.scrollTop += e.deltaY
        } else {
          // Target is in main menu
          e.stopPropagation()
          e.preventDefault()
          menuRef.current.scrollTop += e.deltaY
        }
      }
    }

    // Add the listener with capture: true to catch it early
    document.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', handleGlobalWheel, { capture: true })
    }
  }, [showMenu, isMouseOver, menuRef])

  const handleMouseEnter = () => {
    setIsMouseOver(true)
  }

  const handleMouseLeave = () => {
    setIsMouseOver(false)
  }

  const handleMenuMouseDown = (e: React.MouseEvent<HTMLUListElement>) => {
    // Prevent input from losing focus when interacting with the menu
    // This prevents blur-based menu closing when using scrollbars
    e.preventDefault()
  }

  const handleMouseoverSubmenu = useCallback(() => {
    setIsOverSubmenu(true)
  }, [])

  const handleMouseleaveSubmenu = useCallback(() => {
    setIsOverSubmenu(false)
    pendingCloseRef.current = openSubmenuIndex
  }, [openSubmenuIndex])

  const handleMouseoverParent = useCallback(
    (index: number) => {
      setIsOverParentIndex(index)
      onOpenSubmenu?.(index)
    },
    [onOpenSubmenu]
  )

  const handleMouseleaveParent = useCallback((index: number) => {
    setIsOverParentIndex(-1)
    pendingCloseRef.current = index
  }, [])

  const menuItems = useMemo(
    () =>
      items.map((item, index) => {
        const hasSubitems = item.subitems && item.subitems.length > 0
        const isSubmenuOpen = openSubmenuIndex === index

        return (
          <li
            key={item.value}
            id={`${dropdownId}-item-${index}`}
            className={mergeClasses(
              'text-foreground relative py-2 cursor-pointer hover:bg-dropdown-item-hover',
              focusedIndex === index && focusedSubIndex === -1 ? 'bg-dropdown-item-selected' : '',
              isSubmenuOpen ? 'bg-dropdown-item-hover' : '',
              highlightSelected && isItemSelected?.(item) ? 'text-yellow-400' : ''
            )}
            role={hasSubitems ? 'menuitem' : 'option'}
            tabIndex={-1}
            aria-selected={!hasSubitems && (isItemSelected ? isItemSelected(item) : focusedIndex === index)}
            aria-haspopup={hasSubitems ? 'menu' : undefined}
            aria-expanded={hasSubitems ? isSubmenuOpen : undefined}
            onClick={(e) => {
              e.stopPropagation()
              onItemClick?.(item)
            }}
            onMouseDown={(e) => e.preventDefault()}
            onMouseOver={hasSubitems ? () => handleMouseoverParent(index) : undefined}
            onMouseLeave={hasSubitems ? () => handleMouseleaveParent(index) : undefined}
          >
            <div className="flex items-center">
              <span className={mergeClasses('ms-3 block truncate font-sans text-sm', item.subtext ? 'font-semibold' : '')}>{item.text}</span>
              {item.subtext && <span>:&nbsp;</span>}
              {item.subtext && <span className="font-normal block truncate font-sans text-sm text-foreground-subdued">{item.subtext}</span>}
            </div>
            {hasSubitems && (
              <div className="absolute inset-y-0 right-2 h-full flex items-center pointer-events-none">
                <span className="material-symbols text-lg">arrow_right</span>
              </div>
            )}
            {item.rightIcon && !hasSubitems && <div className="absolute inset-y-0 right-2 h-full flex items-center pointer-events-none">{item.rightIcon}</div>}
            {showSelectedIndicator && isItemSelected && isItemSelected(item) && !hasSubitems && (
              <span className="absolute inset-y-0 end-0 flex items-center pe-4">
                <span className="material-symbols text-xl text-yellow-400">check</span>
              </span>
            )}

            {/* Submenu */}
            {hasSubitems && isSubmenuOpen && (
              <DropdownSubmenu
                subitems={item.subitems!}
                dropdownId={dropdownId}
                parentIndex={index}
                focusedSubIndex={focusedSubIndex}
                onSubitemClick={onSubitemClick}
                onMouseOver={handleMouseoverSubmenu}
                onMouseLeave={handleMouseleaveSubmenu}
                openLeft={openSubmenuLeft}
                submenuWidth={submenuWidth}
                filterText={submenuFilterText}
                t={t}
              />
            )}
          </li>
        )
      }),
    [
      items,
      focusedIndex,
      focusedSubIndex,
      openSubmenuIndex,
      dropdownId,
      isItemSelected,
      showSelectedIndicator,
      onItemClick,
      onSubitemClick,
      highlightSelected,
      handleMouseoverParent,
      handleMouseleaveParent,
      handleMouseoverSubmenu,
      handleMouseleaveSubmenu,
      submenuWidth,
      openSubmenuLeft,
      submenuFilterText,
      t
    ]
  )

  const menuContent = (
    <ul
      ref={menuRef}
      className={mergeClasses(
        'absolute z-10 w-full bg-primary border border-dropdown-menu-border shadow-lg rounded-md py-1 ring-1 ring-black/5 sm:text-sm mt-0.5',
        // Only allow overflow when no submenu is open, otherwise submenu gets clipped
        openSubmenuIndex === null ? 'overflow-auto' : 'overflow-visible',
        className
      )}
      role="listbox"
      id={`${dropdownId}-listbox`}
      tabIndex={-1}
      style={{
        // Use max available viewport height minus some padding, unless explicitly set smaller
        maxHeight: `min(${menuMaxHeight}, calc(100vh - 100px))`,
        ...(usePortal
          ? {
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999
            }
          : {})
      }}
      aria-multiselectable={multiSelect}
      aria-activedescendant={
        focusedSubIndex !== -1 && openSubmenuIndex !== null
          ? `${dropdownId}-subitem-${openSubmenuIndex}-${focusedSubIndex}`
          : `${dropdownId}-item-${focusedIndex}`
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMenuMouseDown}
    >
      {menuItems}
      {showNoItemsMessage && !items.length && (
        <li className="text-foreground select-none relative py-2 pe-9" role="option" aria-selected={false} cy-id="dropdown-menu-no-items">
          <div className="flex items-center justify-center">
            <span className="font-normal">{defaultNoItemsText}</span>
          </div>
        </li>
      )}
    </ul>
  )

  if (!showMenu) {
    return null
  }

  if (usePortal && typeof document !== 'undefined') {
    const portalTarget = portalContainerRef?.current || document.body
    return createPortal(menuContent, portalTarget)
  }

  return menuContent
}
