'use client'

import { useClickOutside } from '@/hooks/useClickOutside'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu'
import InputWrapper from './InputWrapper'
import Label from './Label'

interface InputDropdownProps {
  value?: string | number
  label?: string
  placeholder?: string
  items?: (string | number)[]
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  showAllWhenEmpty?: boolean
  onChange?: (value: string | number) => void
  onNewItem?: (value: string) => void
  className?: string
}

/**
 * An input dropdown component that allows users to type and select from a filtered list of items.
 * The component supports both selection from existing items and creation of new items.
 */
export default function InputDropdown({
  value,
  label = '',
  placeholder = '',
  items = [],
  disabled = false,
  size = 'medium',
  showAllWhenEmpty = false,
  onChange,
  onNewItem,
  className
}: InputDropdownProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [textInput, setTextInput] = useState(value?.toString() || '')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const lastSubmittedValueRef = useRef<string | null>(null)

  // Generate unique ID for this dropdown instance
  const dropdownId = useId()

  // Reset last submitted value when value prop changes
  useEffect(() => {
    const newValue = value?.toString() || ''
    lastSubmittedValueRef.current = newValue
  }, [value])

  const openMenu = useCallback((index: number = -1) => {
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

  useClickOutside(menuRef, wrapperRef, handleClickOutside)

  const itemsToShow = useMemo(() => {
    if (!textInput) return items
    return items.filter((item) => {
      const itemValue = String(item).toLowerCase()
      return itemValue.includes(textInput.toLowerCase())
    })
  }, [textInput, items])

  const onInputFocus = useCallback(() => {
    if (textInput || showAllWhenEmpty) {
      openMenu()
    }
  }, [textInput, showAllWhenEmpty, openMenu])

  const submitTextInput = useCallback(() => {
    const val = textInput ? textInput.trim() : null
    if (val && val !== lastSubmittedValueRef.current) {
      lastSubmittedValueRef.current = val
      onChange?.(val)
      if (!items.includes(val)) {
        onNewItem?.(val)
      }
    }
  }, [textInput, onChange, onNewItem, items])

  const onInputBlur = useCallback(() => {
    submitTextInput()
  }, [submitTextInput])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setTextInput(newValue)
      if (newValue || showAllWhenEmpty) {
        openMenu()
      }
    },
    [showAllWhenEmpty, openMenu]
  )

  const handleOptionClick = useCallback(
    (item: string | number) => {
      const itemValue = item.toString()
      setTextInput(itemValue)
      lastSubmittedValueRef.current = itemValue
      onChange?.(item)
      closeMenu()
    },
    [onChange, closeMenu]
  )

  // Keyboard navigation handlers
  const handleVerticalNavigation = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'down') {
        if (!showMenu) {
          openMenu(0)
        } else {
          setFocusedIndex((prev) => (prev === -1 ? 0 : prev < itemsToShow.length - 1 ? prev + 1 : prev))
        }
      } else {
        if (!showMenu) {
          openMenu(itemsToShow.length - 1)
        } else {
          setFocusedIndex((prev) => (prev === -1 ? itemsToShow.length - 1 : prev > 0 ? prev - 1 : prev))
        }
      }
    },
    [showMenu, itemsToShow, openMenu]
  )

  const handleEnter = useCallback(() => {
    if (showMenu && focusedIndex >= 0 && focusedIndex < itemsToShow.length) {
      handleOptionClick(itemsToShow[focusedIndex])
    } else {
      submitTextInput()
    }
    closeMenu()
  }, [showMenu, focusedIndex, itemsToShow, handleOptionClick, closeMenu, submitTextInput])

  const handleEscape = useCallback(() => {
    closeMenu()
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
          e.preventDefault()
          handleEnter()
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
    [disabled, handleVerticalNavigation, handleEnter, handleEscape, handleHomeEnd, handleTab]
  )

  const isMenuItemSelected = useCallback(
    (item: DropdownMenuItem) => {
      return value?.toString() === String(item.value)
    },
    [value]
  )

  const dropdownMenuItems: DropdownMenuItem[] = useMemo(
    () =>
      itemsToShow.map((item) => ({
        text: String(item),
        value: item
      })),
    [itemsToShow]
  )

  const inputId = useMemo(() => `${dropdownId}-input`, [dropdownId])

  return (
    <div className={mergeClasses('w-full', className)}>
      {label && (
        <Label htmlFor={inputId} disabled={disabled}>
          {label}
        </Label>
      )}

      <div ref={wrapperRef} className="relative">
        <InputWrapper disabled={disabled} size={size} inputRef={inputRef}>
          <input
            role="combobox"
            ref={inputRef}
            id={inputId}
            value={textInput}
            autoComplete="off"
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            placeholder={placeholder}
            className={mergeClasses(
              'h-full w-full bg-transparent px-1 outline-none disabled:cursor-not-allowed disabled:text-disabled',
              size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
            )}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            aria-autocomplete="list"
            aria-controls={`${dropdownId}-menu`}
            aria-expanded={showMenu}
            aria-activedescendant={focusedIndex >= 0 ? `${dropdownId}-item-${focusedIndex}` : undefined}
            cy-id="input-dropdown-input"
          />
        </InputWrapper>

        <DropdownMenu
          showMenu={showMenu}
          items={dropdownMenuItems}
          focusedIndex={focusedIndex}
          dropdownId={dropdownId}
          onItemClick={(item) => handleOptionClick(item.value)}
          isItemSelected={isMenuItemSelected}
          showSelectedIndicator={true}
          menuMaxHeight="224px"
          className="z-50"
          showNoItemsMessage={true}
          ref={menuRef}
        />
      </div>
    </div>
  )
}
