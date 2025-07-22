'use client'

import { useRef, useMemo, useEffect } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

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
  ref: externalRef
}: DropdownMenuProps) {
  const internalRef = useRef<HTMLUListElement>(null)
  const menuRef = externalRef || internalRef

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

  const handleItemClick = (e: React.MouseEvent, item: DropdownMenuItem) => {
    e.stopPropagation()
    onItemClick?.(item)
  }

  const handleItemMouseDown = (e: React.MouseEvent) => {
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

  return (
    <>
      {showMenu && (
        <ul
          ref={menuRef}
          className={mergeClasses(
            'absolute z-10 w-full bg-primary border border-black-200 shadow-lg rounded-md py-1 ring-1 ring-black/5 overflow-auto sm:text-sm',
            className
          )}
          role="listbox"
          id={`${dropdownId}-listbox`}
          tabIndex={-1}
          style={{ maxHeight: menuMaxHeight }}
          aria-multiselectable={multiSelect}
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
      )}
    </>
  )
}
