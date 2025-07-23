'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { mergeClasses } from '@/lib/merge-classes'
import { useMenuPosition } from '@/hooks/useMenuPosition'

export interface DropdownMenuItem {
  text: string
  value: string | number
  subtext?: string
}

interface DropdownMenuProps {
  showMenu: boolean
  items: DropdownMenuItem[]
  multiSelect?: boolean
  focusedIndex: number
  dropdownId: string
  onItemClick?: (item: DropdownMenuItem) => void
  isItemSelected?: (item: DropdownMenuItem) => boolean
  showSelectedIndicator?: boolean
  showNoItemsMessage?: boolean
  noItemsText?: string
  menuMaxHeight?: string
  className?: string
  ref?: React.RefObject<HTMLUListElement | null>
  usePortal?: boolean
  triggerRef?: React.RefObject<HTMLElement>
  onClose?: () => void
}

/**
 * A reusable dropdown menu component that provides consistent styling and behavior
 * for dropdown menus across the application.
 */
export default function DropdownMenu({
  showMenu,
  items,
  multiSelect = false,
  focusedIndex,
  dropdownId,
  onItemClick,
  isItemSelected,
  showSelectedIndicator = false,
  showNoItemsMessage = false,
  noItemsText = 'No items',
  menuMaxHeight = '224px',
  className,
  ref: externalRef,
  usePortal = false,
  triggerRef,
  onClose
}: DropdownMenuProps) {
  const internalRef = useRef<HTMLUListElement>(null)
  const menuRef = externalRef || internalRef
  const [menuPosition, setMenuPosition] = useState<{ top: string; left: string; width: string }>({
    top: '0px',
    left: '0px',
    width: 'auto'
  })
  const [isMouseOver, setIsMouseOver] = useState(false)

  // Use the menu position hook when portal is enabled
  useMenuPosition({
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    menuRef: menuRef as React.RefObject<HTMLElement>,
    isOpen: showMenu && usePortal,
    onPositionChange: setMenuPosition,
    onClose,
    disable: !usePortal || !triggerRef
  })

  // Scroll focused item into view
  useEffect(() => {
    if (showMenu && focusedIndex >= 0 && menuRef?.current) {
      const focusedElement = menuRef.current.querySelector(`#${dropdownId}-item-${focusedIndex}`) as HTMLElement
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [focusedIndex, showMenu, dropdownId, menuRef])

  // Add global wheel event listener for quicker catching of mouse wheel events
  useEffect(() => {
    if (!showMenu || !isMouseOver) return

    const handleGlobalWheel = (e: WheelEvent) => {
      // Check if the mouse is over the dropdown menu
      if (menuRef?.current && menuRef.current.contains(e.target as Node)) {
        e.stopPropagation()
        e.preventDefault()

        // Manually scroll the dropdown
        menuRef.current.scrollTop += e.deltaY
      }
    }

    // Add the listener with capture: true to catch it early
    document.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', handleGlobalWheel, { capture: true })
    }
  }, [showMenu, isMouseOver, menuRef])

  const handleItemClick = (e: React.MouseEvent, item: DropdownMenuItem) => {
    e.stopPropagation()
    onItemClick?.(item)
  }

  const handleItemMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

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

  const menuItems = useMemo(
    () =>
      items.map((item, index) => (
        <li
          key={item.value}
          id={`${dropdownId}-item-${index}`}
          className={mergeClasses('text-gray-100 relative py-2 cursor-pointer hover:bg-black-400', focusedIndex === index ? 'bg-black-300' : '')}
          role="option"
          tabIndex={-1}
          aria-selected={isItemSelected ? isItemSelected(item) : focusedIndex === index}
          onClick={(e) => handleItemClick(e, item)}
          onMouseDown={handleItemMouseDown}
        >
          <div className="flex items-center">
            <span className={mergeClasses('ml-3 block truncate font-sans text-sm', item.subtext ? 'font-semibold' : '')}>{item.text}</span>
            {item.subtext && <span>:&nbsp;</span>}
            {item.subtext && <span className="font-normal block truncate font-sans text-sm text-gray-400">{item.subtext}</span>}
          </div>
          {showSelectedIndicator && isItemSelected && isItemSelected(item) && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="material-symbols text-xl text-yellow-400">check</span>
            </span>
          )}
        </li>
      )),
    [items, focusedIndex, dropdownId, onItemClick, isItemSelected, showSelectedIndicator]
  )

  const menuContent = (
    <ul
      ref={menuRef}
      className={mergeClasses(
        'absolute z-10 w-full bg-primary border border-black-200 shadow-lg rounded-md py-1 ring-1 ring-black/5 overflow-auto sm:text-sm mt-0.5',
        className
      )}
      role="listbox"
      id={`${dropdownId}-listbox`}
      tabIndex={-1}
      style={{
        maxHeight: menuMaxHeight,
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMenuMouseDown}
    >
      {menuItems}
      {showNoItemsMessage && !items.length && (
        <li className="text-gray-100 select-none relative py-2 pr-9" role="option" cy-id="dropdown-menu-no-items">
          <div className="flex items-center justify-center">
            <span className="font-normal">{noItemsText}</span>
          </div>
        </li>
      )}
    </ul>
  )

  if (!showMenu) {
    return null
  }

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(menuContent, document.body)
  }

  return menuContent
}
