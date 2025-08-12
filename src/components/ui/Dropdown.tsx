'use client'

import { useState, useRef, useCallback, useMemo, useId } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { mergeClasses } from '@/lib/merge-classes'
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu'
import Label from './Label'

export interface DropdownItem {
  text: string
  value: string | number
  subtext?: string
}

interface DropdownProps {
  value?: string | number
  label?: string
  items?: DropdownItem[]
  disabled?: boolean
  small?: boolean
  menuMaxHeight?: string
  onChange?: (value: string | number) => void
  className?: string
}

/**
 * A dropdown component that displays a list of selectable items.
 * The dropdown shows the selected item and allows users to choose from a list of options.
 */
export default function Dropdown({
  value,
  label = '',
  items = [],
  disabled = false,
  small = false,
  menuMaxHeight = '224px',
  onChange,
  className
}: DropdownProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  // Generate unique ID for this dropdown instance
  const dropdownId = useId()

  const openMenu = useCallback((index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
  }, [])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(-1)
  }, [])

  const handleClickOutside = useCallback(() => {
    closeMenu()
  }, [closeMenu])

  useClickOutside(menuRef, buttonRef, handleClickOutside)

  const toggleMenu = useCallback(() => {
    if (disabled) return
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [disabled, showMenu, openMenu, closeMenu])

  const handleOptionClick = useCallback(
    (itemValue: string | number) => {
      onChange?.(itemValue)
      closeMenu()
    },
    [onChange, closeMenu]
  )

  const itemsToShow = useMemo(
    () =>
      items.map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return {
            text: String(item),
            value: item
          }
        }
        return item
      }),
    [items]
  )

  const selectedItem = useMemo(() => itemsToShow.find((item) => item.value === value), [itemsToShow, value])

  const selectedText = selectedItem?.text || ''
  const selectedSubtext = selectedItem?.subtext || ''

  const buttonClass = useMemo(() => {
    const classes = []
    if (small) classes.push('h-9')
    else classes.push('h-10')

    return classes.join(' ')
  }, [small])

  const longLabel = useMemo(() => {
    let result = ''
    if (label) result += label + ': '
    if (selectedText) result += selectedText
    if (selectedSubtext) result += ' ' + selectedSubtext
    return result
  }, [label, selectedText, selectedSubtext])

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleMenu()
    },
    [toggleMenu]
  )

  // Keyboard navigation handlers
  const handleVerticalNavigation = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'down') {
        if (!showMenu) {
          openMenu()
        } else {
          setFocusedIndex((prev) => (prev < itemsToShow.length - 1 ? prev + 1 : prev))
        }
      } else {
        if (!showMenu) {
          openMenu(itemsToShow.length - 1)
        } else {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
      }
    },
    [showMenu, itemsToShow, openMenu]
  )

  const handleEnterSpace = useCallback(() => {
    if (!showMenu) {
      openMenu()
    } else if (focusedIndex >= 0 && focusedIndex < itemsToShow.length) {
      handleOptionClick(itemsToShow[focusedIndex].value)
    }
  }, [showMenu, focusedIndex, itemsToShow, handleOptionClick, openMenu])

  const handleEscape = useCallback(() => {
    closeMenu()
    buttonRef.current?.focus()
  }, [closeMenu])

  const handleHomeEnd = useCallback(
    (key: 'home' | 'end') => {
      if (showMenu) {
        if (key === 'home') {
          setFocusedIndex(0)
        } else {
          setFocusedIndex(itemsToShow.length - 1)
        }
      }
    },
    [showMenu, itemsToShow]
  )

  const handleTab = useCallback(() => {
    if (showMenu) {
      closeMenu()
    }
  }, [showMenu, closeMenu])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    [disabled, handleVerticalNavigation, handleEnterSpace, handleEscape, handleHomeEnd, handleTab]
  )

  const dropdownMenuItems: DropdownMenuItem[] = useMemo(
    () =>
      itemsToShow.map((item) => ({
        text: item.text,
        value: item.value,
        subtext: item.subtext
      })),
    [itemsToShow]
  )

  const dropdownButtonId = useMemo(() => `${dropdownId}-button`, [dropdownId])

  return (
    <div className={mergeClasses('relative w-full', className)}>
      {label && (
        <Label htmlFor={dropdownButtonId} disabled={disabled}>
          {label}
        </Label>
      )}

      <button
        ref={buttonRef}
        id={dropdownButtonId}
        type="button"
        aria-label={longLabel}
        disabled={disabled}
        className={mergeClasses(
          'relative w-full border rounded-sm shadow-xs pl-3 pr-8 py-2 text-left sm:text-sm',
          'cursor-pointer border-gray-600 bg-primary text-gray-100',
          'disabled:cursor-not-allowed disabled:border-none disabled:bg-bg-disabled disabled:text-disabled',
          buttonClass
        )}
        aria-haspopup="listbox"
        aria-expanded={showMenu}
        aria-activedescendant={focusedIndex >= 0 ? `${dropdownId}-item-${focusedIndex}` : undefined}
        aria-controls={`${dropdownId}-listbox`}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
      >
        <span className="flex items-center">
          <span className={mergeClasses('block truncate font-sans', selectedSubtext ? 'font-semibold' : '', small ? 'text-sm' : '')}>{selectedText}</span>
          {selectedSubtext && <span>:&nbsp;</span>}
          {selectedSubtext && <span className="font-normal block truncate font-sans text-sm text-gray-400">{selectedSubtext}</span>}
        </span>
        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <span className="material-symbols text-2xl">expand_more</span>
        </span>
      </button>

      <DropdownMenu
        showMenu={showMenu}
        items={dropdownMenuItems}
        focusedIndex={focusedIndex}
        dropdownId={dropdownId}
        onItemClick={(item) => handleOptionClick(item.value)}
        menuMaxHeight={menuMaxHeight}
        showNoItemsMessage={false}
        ref={menuRef}
      />
    </div>
  )
}
