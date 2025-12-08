'use client'

import { useClickOutside } from '@/hooks/useClickOutside'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu'
import InputWrapper from './InputWrapper'
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
  size?: 'small' | 'medium' | 'large'
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
  size = 'medium',
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

  const openMenu = (index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
  }

  // Keep useCallback for closeMenu since it's used in useClickOutside hook dependency
  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(-1)
  }, [])

  useClickOutside(menuRef, buttonRef, closeMenu)

  const toggleMenu = () => {
    if (disabled) return
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  const handleOptionClick = (itemValue: string | number) => {
    onChange?.(itemValue)
    closeMenu()
  }

  // Keep useMemo for itemsToShow since it maps an array
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

  const selectedItem = itemsToShow.find((item) => item.value === value)
  const selectedText = selectedItem?.text || ''
  const selectedSubtext = selectedItem?.subtext || ''

  let longLabel = ''
  if (label) longLabel += label + ': '
  if (selectedText) longLabel += selectedText
  if (selectedSubtext) longLabel += ' ' + selectedSubtext

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMenu()
  }

  // Keyboard navigation handlers
  const handleVerticalNavigation = (direction: 'up' | 'down') => {
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
  }

  const handleEnterSpace = () => {
    if (!showMenu) {
      openMenu()
    } else if (focusedIndex >= 0 && focusedIndex < itemsToShow.length) {
      handleOptionClick(itemsToShow[focusedIndex].value)
    }
  }

  const handleEscape = () => {
    closeMenu()
    buttonRef.current?.focus()
  }

  const handleHomeEnd = (key: 'home' | 'end') => {
    if (showMenu) {
      if (key === 'home') {
        setFocusedIndex(0)
      } else {
        setFocusedIndex(itemsToShow.length - 1)
      }
    }
  }

  const handleTab = () => {
    if (showMenu) {
      closeMenu()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  }

  const dropdownMenuItems: DropdownMenuItem[] = itemsToShow.map((item) => ({
    text: item.text,
    value: item.value,
    subtext: item.subtext
  }))

  const dropdownButtonId = `${dropdownId}-button`

  return (
    <div className={mergeClasses('relative w-full', className)}>
      {label && (
        <Label htmlFor={dropdownButtonId} disabled={disabled}>
          {label}
        </Label>
      )}

      <InputWrapper disabled={disabled} size={size} inputRef={buttonRef}>
        <button
          ref={buttonRef}
          id={dropdownButtonId}
          type="button"
          aria-label={longLabel}
          disabled={disabled}
          className={mergeClasses(
            'relative w-full text-left cursor-pointer text-foreground',
            'ps-1 h-full bg-transparent border-none outline-none flex items-center justify-between',
            'disabled:cursor-not-allowed disabled:text-disabled',
            size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
          )}
          aria-haspopup="listbox"
          aria-expanded={showMenu}
          aria-activedescendant={focusedIndex >= 0 ? `${dropdownId}-item-${focusedIndex}` : undefined}
          aria-controls={`${dropdownId}-listbox`}
          onClick={handleButtonClick}
          onKeyDown={handleKeyDown}
        >
          <span className="flex items-center min-w-0 flex-1 gap-0">
            <span className={mergeClasses('block truncate font-sans shrink', selectedSubtext ? 'font-semibold max-w-[75%]' : '')}>{selectedText}</span>
            {selectedSubtext && <span className="flex-shrink-0">:&nbsp;</span>}
            {selectedSubtext && <span className="font-normal block truncate font-sans text-gray-400 shrink max-w-[25%]">{selectedSubtext}</span>}
          </span>
          <span className="ms-3 flex items-center pointer-events-none flex-shrink-0">
            <span className="material-symbols text-2xl">expand_more</span>
          </span>
        </button>
      </InputWrapper>

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
