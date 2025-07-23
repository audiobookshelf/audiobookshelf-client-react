import React, { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react'
import DropdownMenu from './DropdownMenu'
import type { DropdownMenuItem } from './DropdownMenu'
import { mergeClasses } from '@/lib/merge-classes'
import Pill from './Pill'

interface MultiSelectProps {
  selectedItems: string[]
  items: string[]
  label?: string
  disabled?: boolean
  showEdit?: boolean
  menuDisabled?: boolean
  onSelectedItemsChanged: (val: string[]) => void
  onEdit?: (item: string) => void
  onRemovedItem?: (item: string) => void
  onNewItem?: (item: string) => void
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  selectedItems = [],
  items,
  label,
  disabled = false,
  showEdit = false,
  menuDisabled = false,
  onSelectedItemsChanged,
  onEdit,
  onRemovedItem,
  onNewItem
}) => {
  const [textInput, setTextInput] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [filteredItems, setFilteredItems] = useState<string[] | null>(null)
  // focusIndex: null = none, >=0 = dropdown item, <0 = pill (e.g. -1 = last pill)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const identifier = useId()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showMenu = isMenuOpen && !menuDisabled

  const itemsToShow = useMemo(() => {
    return !textInput || !filteredItems ? items : filteredItems
  }, [textInput, filteredItems, items])

  const dropdownItems: DropdownMenuItem[] = useMemo(() => {
    return itemsToShow.map((item, idx) => ({
      text: String(item),
      value: item
    }))
  }, [itemsToShow])

  const openMenu = useCallback((index: number | null) => {
    setIsMenuOpen(true)
    setFocusIndex(index)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
    setFocusIndex(null)
  }, [])

  const resetInput = useCallback(() => {
    setTextInput(null)
    setFocusIndex(null)
  }, [])

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      openMenu(null)
      setTextInput(e.target.value)
    },
    [openMenu]
  )

  const addSelectedItem = useCallback(
    (itemValue: string) => {
      let newSelected: string[]
      if (selectedItems.includes(itemValue)) {
        //newSelected = selectedItems.filter((s) => s !== itemValue)
        //onRemovedItem?.(itemValue)
        return
      } else {
        newSelected = selectedItems.concat([itemValue])
      }
      resetInput()
      onSelectedItemsChanged(newSelected)
    },
    [selectedItems, onSelectedItemsChanged, resetInput]
  )

  // Handle dropdown menu item click
  const handleDropdownItemClick = useCallback(
    (item: DropdownMenuItem) => {
      addSelectedItem(String(item.value))
    },
    [addSelectedItem]
  )

  // Check if item is selected
  const isItemSelected = useCallback(
    (item: DropdownMenuItem) => {
      return selectedItems.includes(String(item.value))
    },
    [selectedItems]
  )

  // Remove item
  const removeItem = useCallback(
    (item: string) => {
      const remaining = selectedItems.filter((i) => i !== item)
      onSelectedItemsChanged(remaining)
      onRemovedItem?.(item)
    },
    [selectedItems, onSelectedItemsChanged, onRemovedItem]
  )

  // Insert new item
  const insertNewItem = useCallback(
    (item: string) => {
      const newSelected = [...selectedItems, item]
      onSelectedItemsChanged(newSelected)
      onNewItem?.(item)
      resetInput()
    },
    [selectedItems, onSelectedItemsChanged, onNewItem, resetInput]
  )

  // Submit form
  const submitForm = useCallback(() => {
    if (!textInput) return
    const cleaned = textInput.trim()
    if (!cleaned) {
      resetInput()
    } else {
      const matchedItem = items.find((i) => i === cleaned)
      if (matchedItem) {
        addSelectedItem(matchedItem)
      } else {
        insertNewItem(cleaned)
      }
    }
    if (inputRef.current) inputRef.current.style.width = '24px'
  }, [textInput, items, addSelectedItem, insertNewItem, resetInput])

  // Focus/blur logic
  const inputFocus = useCallback(() => {
    openMenu(null)
  }, [openMenu])

  const inputBlur = useCallback(() => {
    if (!isMenuOpen) return
    setTimeout(() => {
      if (document.activeElement === inputRef.current) return
      closeMenu()
      if (textInput) submitForm()
    }, 50)
  }, [isMenuOpen, textInput, submitForm, closeMenu])

  const addPastedItems = useCallback(
    (pastedItems: string[]) => {
      const itemsToAdd = pastedItems
        .filter((item) => !selectedItems.some((i) => i.toLowerCase() === item.toLowerCase()))
        .map((item) => {
          const itemExists = items.find((i) => i.toLowerCase() === item.toLowerCase())
          return itemExists || item
        })
      if (itemsToAdd.length) {
        onSelectedItemsChanged([...selectedItems, ...itemsToAdd])
        itemsToAdd.forEach((item) => {
          const itemExists = items.find((i) => i.toLowerCase() === item.toLowerCase())
          if (!itemExists) {
            onNewItem?.(item)
          }
        })
        resetInput()
      }
    },
    [selectedItems, onSelectedItemsChanged, onNewItem, items, resetInput]
  )

  const inputPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData?.getData('text') || ''
      const pastedItems = [
        ...new Set(
          pastedText
            .split(';')
            .map((i) => i.trim())
            .filter((i) => i)
        )
      ]
      addPastedItems(pastedItems)
      e.preventDefault()
    },
    [selectedItems, addPastedItems]
  )

  const handleArrowDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const itemCount = dropdownItems.length
      if (!isMenuOpen) {
        openMenu(0)
      } else {
        setFocusIndex((prev) => {
          if (prev === null || prev < 0) return 0
          return prev < itemCount - 1 ? prev + 1 : prev
        })
      }
    },
    [dropdownItems, isMenuOpen, openMenu]
  )

  const handleArrowUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const itemCount = dropdownItems.length
      if (!isMenuOpen) {
        openMenu(itemCount - 1)
      } else {
        setFocusIndex((prev) => {
          if (prev === null || prev < 0) return itemCount - 1
          return prev > 0 ? prev - 1 : prev
        })
      }
    },
    [dropdownItems, isMenuOpen, openMenu]
  )

  const handleEnter = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const itemCount = dropdownItems.length
      if (focusIndex !== null && focusIndex >= 0 && focusIndex < itemCount) {
        handleDropdownItemClick(dropdownItems[focusIndex])
      } else if (focusIndex !== null && focusIndex < 0) {
        const pillIdx = selectedItems.length + focusIndex
        if (pillIdx >= 0 && selectedItems[pillIdx]) {
          if (showEdit) {
            onEdit?.(selectedItems[pillIdx])
          }
        }
      } else if (textInput) {
        submitForm()
      }
    },
    [dropdownItems, focusIndex, handleDropdownItemClick, onEdit, selectedItems, showEdit, submitForm, textInput]
  )

  const handleEscape = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      closeMenu()
    },
    [closeMenu]
  )

  const handleHome = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      openMenu(0)
    },
    [openMenu]
  )

  const handleEnd = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const itemCount = dropdownItems.length
      openMenu(itemCount - 1)
    },
    [dropdownItems, openMenu]
  )

  const handleTab = useCallback(() => {
    closeMenu()
    inputRef.current?.blur()
  }, [closeMenu])

  const handleArrowLeft = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const pillCount = selectedItems.length
      if (!textInput && pillCount > 0) {
        e.preventDefault()
        setFocusIndex((prev) => {
          if (prev === null || prev >= 0) return -1
          if (Math.abs(prev) < pillCount) return prev - 1
          return prev
        })
      }
    },
    [selectedItems, textInput]
  )

  const handleArrowRight = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!textInput && focusIndex !== null && focusIndex < 0) {
        e.preventDefault()
        setFocusIndex((prev) => {
          if (prev === null) return null
          if (prev < -1) return prev + 1
          return null
        })
      }
    },
    [focusIndex, textInput]
  )

  const handlePillDeletion = useCallback(
    (key: 'Backspace' | 'Delete') => {
      if (focusIndex === null || focusIndex >= 0) {
        if (key === 'Backspace' && !textInput && selectedItems.length > 0) {
          removeItem(selectedItems[selectedItems.length - 1])
        }
        return
      }

      if (focusIndex !== null && focusIndex < 0) {
        const pillIdx = selectedItems.length + focusIndex
        if (pillIdx < 0) return

        const pillToRemove = selectedItems[pillIdx]
        if (key === 'Backspace') {
          // Focus moves to the pill to the left, or to input if first pill is deleted
          setFocusIndex((prev) => {
            if (prev === null || prev === -selectedItems.length) return null
            if (prev <= -1) return prev
            return prev
          })
        } else {
          // Focus remains on the current index, which is now the next pill
          setFocusIndex((prev) => {
            if (prev === null || prev === -1) return null
            if (prev < -1) return prev + 1
            return prev
          })
        }
        removeItem(pillToRemove)
      }
    },
    [focusIndex, removeItem, selectedItems, textInput]
  )

  const keydownHandlers: Record<string, (e: React.KeyboardEvent<HTMLInputElement>) => void> = useMemo(
    () => ({
      ArrowDown: handleArrowDown,
      ArrowUp: handleArrowUp,
      Enter: handleEnter,
      Escape: handleEscape,
      Home: handleHome,
      End: handleEnd,
      Tab: handleTab,
      ArrowLeft: handleArrowLeft,
      ArrowRight: handleArrowRight,
      Backspace: () => handlePillDeletion('Backspace'),
      Delete: () => handlePillDeletion('Delete')
    }),
    [handleArrowDown, handleArrowUp, handleEnter, handleEscape, handleHome, handleEnd, handleTab, handleArrowLeft, handleArrowRight, handlePillDeletion]
  )

  // Keyboard navigation for dropdown menu
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return
      if (keydownHandlers[e.key]) {
        keydownHandlers[e.key](e)
      }
    },
    [disabled, keydownHandlers]
  )

  // Search logic with debouncing
  useEffect(() => {
    // Only search if the input is focused
    if (document.activeElement !== inputRef.current) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to wait for user to stop typing
    const newTimeout = setTimeout(() => {
      if (!textInput) {
        setFilteredItems(null)
      } else {
        const results = items.filter((i) => String(i).toLowerCase().includes(textInput.toLowerCase()))
        setFilteredItems(results || [])
      }
    }, 200)

    typingTimeoutRef.current = newTimeout

    // Cleanup function to clear timeout on unmount or dependency change
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout)
      }
    }
  }, [textInput, items, openMenu])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any pending search timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Compute the id of the currently focused descendant for aria-activedescendant
  let activeDescendantId: string | undefined = undefined
  if (focusIndex !== null) {
    if (focusIndex < 0) {
      // pill
      const pillIdx = selectedItems.length + focusIndex
      if (pillIdx >= 0) activeDescendantId = `${identifier}-pill-${pillIdx}`
    } else {
      // menu item
      activeDescendantId = `${identifier}-menuitem-${focusIndex}`
    }
  }

  const focusPill = useCallback(
    (idx: number) => {
      if (!disabled) {
        // Focus input first, then set focus index
        inputRef.current?.focus()
        setFocusIndex(idx - selectedItems.length)
      }
    },
    [disabled, selectedItems]
  )

  const handlePillClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
      e.stopPropagation()
      e.preventDefault()
      focusPill(idx)
    },
    [focusPill]
  )

  // Handler for input wrapper click
  const handleInputWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        inputRef.current?.focus()
      }
    },
    [disabled]
  )

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={identifier} className={`px-1 text-sm font-semibold ${disabled ? 'text-gray-400' : ''}`}>
          {label}
        </label>
      )}
      <div ref={wrapperRef} className="relative">
        <div
          ref={inputWrapperRef}
          role="list"
          style={{ minHeight: 36 }}
          className={mergeClasses(
            'flex-wrap relative w-full shadow-xs flex items-center border border-gray-600 rounded-sm px-2 py-1 focus-within:outline',
            disabled ? 'bg-black-300 text-gray-400 cursor-not-allowed' : 'bg-primary cursor-text'
          )}
          onClick={handleInputWrapperClick}
          onMouseDown={(e) => e.preventDefault()}
        >
          {selectedItems.map((item, idx) => (
            <Pill
              key={item}
              id={`${identifier}-pill-${idx}`}
              item={item}
              isFocused={focusIndex === idx - selectedItems.length}
              disabled={disabled}
              showEdit={showEdit}
              onClick={(e) => handlePillClick(e, idx)}
              onEdit={onEdit}
              onRemove={removeItem}
            />
          ))}
          {!disabled && (
            <input
              value={textInput ?? ''}
              ref={inputRef}
              id={identifier}
              disabled={disabled}
              className="bg-transparent border-none outline-none px-1 flex-1 min-w-6 text-sm"
              autoComplete="off"
              onKeyDown={handleKeyDown}
              onFocus={inputFocus}
              onBlur={inputBlur}
              onPaste={inputPaste}
              onChange={handleInputChange}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showMenu}
              aria-controls={`${identifier}-listbox`}
              aria-haspopup="listbox"
              aria-disabled={disabled}
              aria-activedescendant={activeDescendantId}
            />
          )}
        </div>
        <DropdownMenu
          showMenu={showMenu}
          items={dropdownItems}
          multiSelect={true}
          focusedIndex={focusIndex !== null && focusIndex >= 0 ? focusIndex : -1}
          dropdownId={identifier}
          onItemClick={handleDropdownItemClick}
          isItemSelected={isItemSelected}
          showSelectedIndicator={true}
          showNoItemsMessage={true}
          noItemsText="No items"
          menuMaxHeight="224px"
          className="z-60"
        />
      </div>
    </div>
  )
}

export default MultiSelect
