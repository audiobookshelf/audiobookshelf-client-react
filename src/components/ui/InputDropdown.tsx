'use client'

import { useState, useRef, useCallback, useMemo, useEffect, useId } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { CSSTransition } from 'react-transition-group'
import '@/assets/transitions.css'
import { mergeClasses } from '@/lib/merge-classes'

interface InputDropdownProps {
  value?: string | number
  label?: string
  items?: (string | number)[]
  disabled?: boolean
  editable?: boolean
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
  items = [],
  disabled = false,
  editable = true,
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

  // Generate unique ID for this dropdown instance
  const dropdownId = useId()

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
    if (!editable) return items
    if (!textInput) return items
    return items.filter((item) => {
      const itemValue = String(item).toLowerCase()
      return itemValue.includes(textInput.toLowerCase())
    })
  }, [editable, textInput, items, showAllWhenEmpty])

  const onInputFocus = useCallback(() => {
    if (textInput || showAllWhenEmpty) {
      openMenu()
    }
  }, [textInput, showAllWhenEmpty, openMenu])

  const onInputBlur = useCallback(() => {
    const val = textInput ? textInput.trim() : null
    if (val) {
      onChange?.(val)
      if (!items.includes(val)) {
        onNewItem?.(val)
      }
    }
  }, [textInput, onChange, onNewItem, items])

  const submitTextInput = useCallback(() => {
    const val = textInput ? textInput.trim() : null
    if (val) {
      onChange?.(val)
      if (!items.includes(val)) {
        onNewItem?.(val)
      }
    }
  }, [textInput, onChange, onNewItem, items])

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
      setTextInput(item.toString())
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

  // Scroll focused item into view
  useEffect(() => {
    if (showMenu && focusedIndex >= 0 && menuRef.current) {
      const focusedElement = menuRef.current.querySelector(`#${dropdownId}-item-${focusedIndex}`) as HTMLElement
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [focusedIndex, showMenu, dropdownId])

  const isMenuItemSelected = useCallback(
    (item: string | number) => {
      return value?.toString() === String(item)
    },
    [value]
  )

  const menuItems = useMemo(
    () =>
      itemsToShow.map((item, index) => (
        <li
          key={item}
          id={`${dropdownId}-item-${index}`}
          className={mergeClasses(
            'text-gray-50 select-none relative py-2 pr-3 cursor-pointer hover:bg-black-400',
            focusedIndex === index ? 'bg-black-300' : ''
          )}
          role="option"
          tabIndex={-1}
          aria-selected={isMenuItemSelected(item)}
          onClick={(e) => {
            e.stopPropagation()
            handleOptionClick(item)
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center">
            <span className="font-normal ml-3 block truncate">{String(item)}</span>
          </div>
          {isMenuItemSelected(item) && (
            <span className="text-yellow-400 absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="material-symbols text-xl">check</span>
            </span>
          )}
        </li>
      )),
    [itemsToShow, focusedIndex, dropdownId, handleOptionClick]
  )

  const inputWrapperClass = useMemo(() => {
    return mergeClasses(
      'input-wrapper flex-wrap relative w-full shadow-xs flex items-center border border-gray-600 rounded-sm px-2 py-2',
      disabled ? 'pointer-events-none bg-black-300 text-gray-400' : 'bg-primary'
    )
  }, [disabled])

  return (
    <div className={mergeClasses('w-full', className)}>
      {label && <label className={mergeClasses('px-1 text-sm font-semibold', disabled ? 'text-gray-400' : '')}>{label}</label>}

      <div ref={wrapperRef} className="relative">
        <div className={inputWrapperClass}>
          <input
            ref={inputRef}
            value={textInput}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            readOnly={!editable}
            className={mergeClasses('h-full w-full bg-transparent px-1', !editable && 'text-gray-600 cursor-default')}
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
        </div>

        <CSSTransition
          in={showMenu}
          timeout={{
            enter: 200,
            exit: 100
          }}
          nodeRef={menuRef}
          classNames="menu"
          unmountOnExit
        >
          <ul
            ref={menuRef}
            className="absolute z-50 mt-0 w-full bg-bg border border-black-200 shadow-lg max-h-56 rounded-sm py-1 text-base ring-1 ring-black/5 overflow-auto focus:outline-hidden sm:text-sm"
            role="listbox"
            id={`${dropdownId}-menu`}
            tabIndex={-1}
            cy-id="input-dropdown-menu"
          >
            {menuItems}
            {!itemsToShow.length && (
              <li className="text-gray-50 select-none relative py-2 pr-9" role="option" cy-id="input-dropdown-no-items">
                <div className="flex items-center justify-center">
                  <span className="font-normal">No items</span>
                </div>
              </li>
            )}
          </ul>
        </CSSTransition>
      </div>
    </div>
  )
}
