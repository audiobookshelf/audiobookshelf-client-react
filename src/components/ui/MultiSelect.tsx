import React, { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react'
import DropdownMenu from './DropdownMenu'
import type { DropdownMenuItem } from './DropdownMenu'
import { mergeClasses } from '@/lib/merge-classes'
import Pill from './Pill'
import { useGlobalToast } from '@/contexts/ToastContext'

export interface MultiSelectItem {
  value: string
  text: string
}

export interface MultiSelectProps {
  value?: string
  selectedItems: MultiSelectItem[]
  items: MultiSelectItem[]
  label?: string
  disabled?: boolean
  showEdit?: boolean
  menuDisabled?: boolean
  onItemEdited?: (item: MultiSelectItem, index: number) => void
  onItemAdded?: (item: MultiSelectItem) => void
  onItemRemoved?: (item: MultiSelectItem) => void
  showInput?: boolean
  allowNew?: boolean
  onInputChange?: (value: string) => void
  editingPillIndex?: number | null
  onEditingPillIndexChange?: (index: number | null) => void
  onEditDone?: (cancelled?: boolean) => void
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  selectedItems = [],
  items,
  label,
  disabled = false,
  showEdit = false,
  menuDisabled = false,
  onItemEdited,
  onItemAdded,
  onItemRemoved,
  showInput = true,
  allowNew = true,
  onInputChange,
  editingPillIndex: controlledEditingPillIndex,
  onEditingPillIndexChange,
  onEditDone
}) => {
  const isControlled = value !== undefined
  const [textInput, setTextInput] = useState<string>(isControlled ? value : '')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [filteredItems, setFilteredItems] = useState<MultiSelectItem[] | null>(null)
  // focusIndex: null = none, >=0 = dropdown item, <0 = pill (e.g. -1 = last pill)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const [uncontrolledEditingPillIndex, setUncontrolledEditingPillIndex] = useState<number | null>(null)
  const isEditingPillIndexControlled = controlledEditingPillIndex !== undefined

  const editingPillIndex = isEditingPillIndexControlled ? controlledEditingPillIndex : uncontrolledEditingPillIndex

  const setEditingPillIndex = useCallback(
    (index: number | null) => {
      if (!isEditingPillIndexControlled) {
        setUncontrolledEditingPillIndex(index)
      }
      onEditingPillIndexChange?.(index)
    },
    [isEditingPillIndexControlled, onEditingPillIndexChange]
  )
  const identifier = useId()
  const { showToast } = useGlobalToast()

  const selectedItemValues = useMemo(() => selectedItems.map((i) => i.value), [selectedItems])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sizerRef = useRef<HTMLSpanElement>(null)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showMenu = isMenuOpen && !menuDisabled

  useEffect(() => {
    if (isControlled) {
      setTextInput(value)
    }
  }, [value, isControlled])

  useEffect(() => {
    if (inputRef.current && inputWrapperRef.current) {
      const containerWidth = inputWrapperRef.current.clientWidth
      // Set max-width to prevent overflow
      inputRef.current.style.maxWidth = `${containerWidth}px`

      if (textInput && sizerRef.current) {
        const sizerWidth = sizerRef.current.getBoundingClientRect().width
        const newWidth = Math.max(24, sizerWidth)
        inputRef.current.style.width = `${newWidth}px`

        // If the content is wider than the input, scroll to the end
        if (inputRef.current.scrollWidth > inputRef.current.clientWidth) {
          inputRef.current.scrollLeft = inputRef.current.scrollWidth
        }
      } else {
        inputRef.current.style.width = '24px'
      }
    }
  }, [textInput])

  const itemsToShow = useMemo(() => {
    return !textInput || !filteredItems ? items : filteredItems
  }, [textInput, filteredItems, items])

  const dropdownItems: DropdownMenuItem[] = useMemo(() => {
    return itemsToShow.map((item) => ({
      text: item.text,
      value: item.value
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

  const setInputValue = useCallback(
    (inputValue: string) => {
      if (!isControlled) {
        setTextInput(inputValue)
      }
      onInputChange?.(inputValue)
    },
    [isControlled]
  )

  const resetInput = useCallback(() => {
    setInputValue('')
    setFocusIndex(null)
  }, [])

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      openMenu(null)
      setInputValue(e.target.value)
    },
    [openMenu, onInputChange]
  )

  const isDuplicate = useCallback(
    (itemValue: string, excludeIndex?: number) => {
      const isDupe = selectedItemValues.some((v, idx) => idx !== excludeIndex && v.toLowerCase() === itemValue.toLowerCase())
      return isDupe
    },
    [selectedItemValues]
  )

  const isTextDuplicate = useCallback(
    (text: string, excludeIndex?: number) => {
      return selectedItems.some((item, idx) => idx !== excludeIndex && item.text.toLowerCase() === text.toLowerCase())
    },
    [selectedItems]
  )

  const addSelectedItem = useCallback(
    (itemValue: string) => {
      if (isDuplicate(itemValue)) {
        removeItem(itemValue)
        resetInput()
        return
      }

      const itemToAdd = items.find((i) => i.value === itemValue)
      if (!itemToAdd) return

      onItemAdded?.(itemToAdd)
      resetInput()
    },
    [isDuplicate, items, onItemAdded, resetInput]
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
      return selectedItemValues.includes(String(item.value))
    },
    [selectedItemValues]
  )

  // Remove item
  const removeItem = useCallback(
    (itemValue: string) => {
      const itemToRemove = selectedItems.find((i) => i.value === itemValue)
      if (itemToRemove) {
        onItemRemoved?.(itemToRemove)
      }
    },
    [selectedItems, onItemRemoved]
  )

  // Insert new item
  const insertNewItem = useCallback(
    (item: string) => {
      if (!allowNew) return
      if (isTextDuplicate(item)) {
        resetInput()
        return
      }
      // Generate value for new items with 'new-' prefix
      const newItem = { value: 'new-' + item, text: item }
      onItemAdded?.(newItem)
      resetInput()
    },
    [onItemAdded, resetInput, allowNew, isTextDuplicate]
  )

  // Submit form
  const submitForm = useCallback(() => {
    if (!textInput) return
    const cleaned = textInput.trim()
    if (!cleaned) {
      resetInput()
    } else {
      const matchedItem = items.find((i) => i.text.toLowerCase() === cleaned.toLowerCase())
      if (matchedItem) {
        addSelectedItem(matchedItem.value)
      } else {
        insertNewItem(cleaned)
      }
    }
  }, [textInput, items, addSelectedItem, insertNewItem, resetInput])

  // Focus/blur logic
  const inputFocus = useCallback(() => {
    openMenu(null)
  }, [openMenu])

  const inputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!isMenuOpen) return
      setTimeout(() => {
        if (document.activeElement === inputRef.current) return
        closeMenu()
        if (textInput) submitForm()
      }, 50)
    },
    [isMenuOpen, textInput, submitForm, closeMenu]
  )

  const addPastedItems = useCallback(
    (pastedItems: string[]) => {
      const itemsToAdd = pastedItems
        .filter((item) => !isTextDuplicate(item))
        .map((item) => {
          const itemExists = items.find((i) => i.text.toLowerCase() === item.toLowerCase())
          if (itemExists) {
            return itemExists
          } else {
            // Generate value for new items with 'new-' prefix
            return { value: 'new-' + item, text: item }
          }
        })
      if (itemsToAdd.length) {
        itemsToAdd.forEach((item) => {
          onItemAdded?.(item)
        })
        resetInput()
      }
    },
    [onItemAdded, items, resetInput, isTextDuplicate]
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
    [addPastedItems]
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
        const pillIdx = selectedItemValues.length + focusIndex
        if (pillIdx >= 0 && selectedItemValues[pillIdx]) {
          if (showEdit) {
            setEditingPillIndex(pillIdx)
          }
        }
      } else if (textInput) {
        submitForm()
      }
    },
    [dropdownItems, focusIndex, handleDropdownItemClick, selectedItemValues, showEdit, submitForm, textInput, setEditingPillIndex]
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
      const pillCount = selectedItemValues.length
      if (!textInput && pillCount > 0) {
        e.preventDefault()
        setFocusIndex((prev) => {
          if (prev === null || prev >= 0) return -1
          if (Math.abs(prev) < pillCount) return prev - 1
          return prev
        })
      }
    },
    [selectedItemValues, textInput]
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
        if (key === 'Backspace' && !textInput && selectedItemValues.length > 0) {
          removeItem(selectedItemValues[selectedItemValues.length - 1])
        }
        return
      }

      if (focusIndex !== null && focusIndex < 0) {
        const pillIdx = selectedItemValues.length + focusIndex
        if (pillIdx < 0) return

        const pillToRemove = selectedItemValues[pillIdx]
        if (key === 'Backspace') {
          // Focus moves to the pill to the left, or to input if first pill is deleted
          setFocusIndex((prev) => {
            if (prev === null || prev === -selectedItemValues.length) return null
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
    [focusIndex, removeItem, selectedItemValues, textInput]
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
        const results = items.filter((i) => i.text.toLowerCase().includes(textInput.toLowerCase()))
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
  }, [textInput, items])

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
      const pillIdx = selectedItemValues.length + focusIndex
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
        setFocusIndex(idx - selectedItemValues.length)
      }
    },
    [disabled, selectedItemValues]
  )

  // Handler for input wrapper click
  const handleInputWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      if (document.activeElement === inputRef.current) {
        setIsMenuOpen((prev) => !prev)
      } else {
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
              key={item.value}
              id={`${identifier}-pill-${idx}`}
              item={item.text}
              isFocused={focusIndex === idx - selectedItemValues.length}
              isEditing={editingPillIndex === idx}
              disabled={disabled}
              showEditButton={showEdit}
              onClick={() => focusPill(idx)}
              onEditButtonClick={() => setEditingPillIndex(idx)}
              onEdit={(newText) => {
                // Find the item being edited and update it
                const itemToUpdate = selectedItems[idx]
                if (itemToUpdate) {
                  const isDupe = isTextDuplicate(newText, idx)
                  if (isDupe) {
                    showToast(`"${newText}" is already selected`, { type: 'warning', title: 'Duplicate item' })
                    return
                  }
                  const updatedItem = { ...itemToUpdate, text: newText }
                  onItemEdited?.(updatedItem, idx)
                }
              }}
              onRemove={() => removeItem(item.value)}
              onEditDone={(shouldRefocus = false, cancelled = false) => {
                setEditingPillIndex(null)
                if (shouldRefocus) {
                  inputRef.current?.focus()
                }
                onEditDone?.(cancelled)
              }}
            />
          ))}
          <span ref={sizerRef} className="absolute invisible whitespace-pre px-1 text-sm">
            {textInput}
          </span>
          <input
            value={isControlled ? value : textInput}
            ref={inputRef}
            id={identifier}
            disabled={disabled}
            className={mergeClasses('bg-transparent border-none outline-none px-1 text-sm', !showInput && 'sr-only')}
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
            readOnly={!showInput}
          />
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
          triggerRef={inputWrapperRef as React.RefObject<HTMLElement>}
        />
      </div>
    </div>
  )
}

export default MultiSelect
