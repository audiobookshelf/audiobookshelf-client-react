'use client'

import { useModalRef } from '@/contexts/ModalContext'
import { useMenuPosition } from '@/hooks/useMenuPosition'
import { useScrollToFocused } from '@/hooks/useScrollToFocused'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'
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
 * Submenu component that handles viewport-aware height limiting and positioning via Portal.
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
  referenceElement,
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
  referenceElement: HTMLElement | null
  filterText: string
  t: ReturnType<typeof useTypeSafeTranslations>
}) {
  const submenuRef = useRef<HTMLUListElement>(null)

  const [scrollbarOffset, setScrollbarOffset] = useState(0)

  // Calculate scrollbar offset to prevent overlapping
  useLayoutEffect(() => {
    if (referenceElement?.parentElement) {
      const parent = referenceElement.parentElement
      const width = parent.offsetWidth - parent.clientWidth
      // Only apply offset if opening to the right and scrollbar is present
      if (width > 0 && !openLeft) {
        setScrollbarOffset(width)
      } else {
        setScrollbarOffset(0)
      }
    }
  }, [referenceElement, openLeft])

  // Floating UI setup
  const { refs, floatingStyles, isPositioned } = useFloating({
    placement: openLeft ? 'left-start' : 'right-start',
    strategy: 'fixed', // Use fixed positioning for portals to avoid stacking context issues
    middleware: [
      // mainAxis: scrollbar gap, crossAxis: -4 to align first item with parent (counteract py-1)
      offset({ mainAxis: scrollbarOffset, crossAxis: -4 }),
      flip(),
      shift({ padding: 10 })
    ],
    whileElementsMounted: autoUpdate,
    elements: {
      reference: referenceElement
    }
  })

  // Sync refs
  useEffect(() => {
    if (submenuRef.current) {
      refs.setFloating(submenuRef.current)
    }
  }, [refs])

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

  const submenuContent = (
    <ul
      ref={submenuRef}
      role="menu"
      className={mergeClasses('absolute bg-primary border border-dropdown-menu-border shadow-lg z-[9999] py-1 rounded-md overflow-y-auto')}
      style={{
        ...floatingStyles,
        width: '192px',
        maxHeight: '300px', // Reasonable max height
        // Hide until positioned to prevent flicker at 0,0
        opacity: isPositioned ? 1 : 0,
        visibility: isPositioned ? 'visible' : 'hidden'
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

  if (typeof document !== 'undefined') {
    return createPortal(submenuContent, document.body)
  }
  return null
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

  // Track whether the submenu should open on the left
  const [openSubmenuLeft, setOpenSubmenuLeft] = useState(false)
  // Track pending submenu closure with timeout
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track hover state for timeout logic
  const isOverSubmenuRef = useRef(false)

  // Store refs to menu items for submenu positioning
  const menuItemRefs = useRef<(HTMLLIElement | null)[]>([])

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
    } else if (!showMenu) {
      // Reset internal state when menu closes
      isOverSubmenuRef.current = false
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [showMenu, menuRef])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

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
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)

    isOverSubmenuRef.current = true
  }, [])

  const handleMouseleaveSubmenu = useCallback(() => {
    isOverSubmenuRef.current = false

    // Schedule close when leaving submenu
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      onCloseSubmenu?.()
    }, 150) // Grace period
  }, [onCloseSubmenu])

  const handleMouseleaveParent = useCallback(() => {
    // Schedule close when leaving parent item
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      // Only close if we haven't entered the submenu
      if (!isOverSubmenuRef.current) {
        onCloseSubmenu?.()
      }
    }, 150) // Grace period
  }, [onCloseSubmenu])

  const handleMouseoverParent = useCallback(
    (index: number) => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      onOpenSubmenu?.(index)
    },
    [onOpenSubmenu]
  )

  const menuItems = useMemo(
    () =>
      items.map((item, index) => {
        const hasSubitems = item.subitems && item.subitems.length > 0
        const isSubmenuOpen = openSubmenuIndex === index

        return (
          <li
            key={item.value}
            id={`${dropdownId}-item-${index}`}
            ref={(el) => {
              menuItemRefs.current[index] = el
            }}
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
            onMouseLeave={hasSubitems ? handleMouseleaveParent : undefined}
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
                referenceElement={menuItemRefs.current[index]}
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
      openSubmenuLeft,
      submenuFilterText,
      t
    ]
  )

  const menuContent = (
    <ul
      ref={menuRef}
      className={mergeClasses(
        'absolute z-10 w-full bg-primary border border-dropdown-menu-border shadow-lg rounded-md py-1 ring-1 ring-black/5 sm:text-sm mt-0.5 overflow-auto',
        className
      )}
      role="listbox"
      id={`${dropdownId}-listbox`}
      tabIndex={-1}
      style={{
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
