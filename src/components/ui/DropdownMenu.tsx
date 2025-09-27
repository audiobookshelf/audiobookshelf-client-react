'use client'

import { useModalRef } from '@/contexts/ModalContext'
import { useMenuPosition } from '@/hooks/useMenuPosition'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  noItemsText,
  menuMaxHeight = '224px',
  className,
  ref: externalRef,
  usePortal: usePortalProp = false,
  triggerRef
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

  const handleItemClick = useCallback(
    (e: React.MouseEvent, item: DropdownMenuItem) => {
      e.stopPropagation()
      onItemClick?.(item)
    },
    [onItemClick]
  )

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
            <span className={mergeClasses('ms-3 block truncate font-sans text-sm', item.subtext ? 'font-semibold' : '')}>{item.text}</span>
            {item.subtext && <span>:&nbsp;</span>}
            {item.subtext && <span className="font-normal block truncate font-sans text-sm text-gray-400">{item.subtext}</span>}
          </div>
          {showSelectedIndicator && isItemSelected && isItemSelected(item) && (
            <span className="absolute inset-y-0 end-0 flex items-center pe-4">
              <span className="material-symbols text-xl text-yellow-400">check</span>
            </span>
          )}
        </li>
      )),
    [items, focusedIndex, dropdownId, isItemSelected, showSelectedIndicator, handleItemClick]
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
      aria-activedescendant={`${dropdownId}-item-${focusedIndex}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMenuMouseDown}
    >
      {menuItems}
      {showNoItemsMessage && !items.length && (
        <li className="text-gray-100 select-none relative py-2 pe-9" role="option" aria-selected={false} cy-id="dropdown-menu-no-items">
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
