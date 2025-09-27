'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { DropdownMenuItem } from './DropdownMenu'
import DropdownMenu from './DropdownMenu'
import InputWrapper from './InputWrapper'
import Label from './Label'
import Pill from './Pill'

export interface MultiSelectItem<T = string> {
  value: string
  content: T
}

export interface MultiSelectProps<T = string> {
  value?: string
  selectedItems: MultiSelectItem<T>[]
  items: MultiSelectItem<string>[]
  label?: string
  disabled?: boolean
  showEdit?: boolean
  showInput?: boolean
  allowNew?: boolean
  menuDisabled?: boolean
  editingPillIndex?: number | null

  // Pill content introspection callbacks
  getEditableText?: (content: T) => string
  getReadOnlyPrefix?: (content: T) => string
  getFullText?: (content: T) => string

  // MultiSelect content introspection callbacks
  getItemTextId?: (content: T) => string

  // Content mutation callback
  onMutate?: (prev: T | null, text: string) => T

  // Validation callback
  onValidate?: (content: T) => string | null // Returns error message or null if valid
  onValidationError?: (error: string) => void
  onDuplicateError?: (message: string) => void

  // Event handlers
  onItemEdited?: (item: MultiSelectItem<T>, index: number) => void
  onItemAdded?: (item: MultiSelectItem<T>) => void
  onItemRemoved?: (item: MultiSelectItem<T>) => void
  onInputChange?: (value: string) => void
  onEditingPillIndexChange?: (index: number | null) => void
  onEditDone?: (cancelled?: boolean) => void
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const MultiSelect = <T extends any = string>({
  value,
  selectedItems = [],
  items,
  label,
  disabled = false,
  showEdit = false,
  showInput = true,
  allowNew = true,
  menuDisabled = false,
  editingPillIndex: controlledEditingPillIndex,
  getEditableText,
  getReadOnlyPrefix,
  getFullText,
  getItemTextId: getItemTextIdProp,
  onMutate: onMutateProp,
  onValidate,
  onValidationError,
  onDuplicateError,
  onItemEdited,
  onItemAdded,
  onItemRemoved,
  onInputChange,
  onEditingPillIndexChange,
  onEditDone
}: MultiSelectProps<T>) => {
  const t = useTypeSafeTranslations()
  const onMutate = useCallback(
    (prev: T | null, text: string): T => {
      if (onMutateProp) {
        return onMutateProp(prev, text)
      }
      // For string types, just return the string
      return text as unknown as T
    },
    [onMutateProp]
  )

  const getItemTextId = useCallback(
    (content: T) => {
      if (getItemTextIdProp) {
        return getItemTextIdProp(content)
      } else if (typeof content === 'string') {
        return content
      } else {
        return String(content)
      }
    },
    [getItemTextIdProp]
  )

  const isControlled = value !== undefined
  const [textInput, setTextInput] = useState<string>(isControlled ? value : '')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [filteredItems, setFilteredItems] = useState<MultiSelectItem<string>[] | null>(null)
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
  const multiSelectId = useId()

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
      text: item.content,
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
    [isControlled, onInputChange]
  )

  const resetInput = useCallback(() => {
    setInputValue('')
    setFocusIndex(null)
  }, [setInputValue])

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      openMenu(null)
      setInputValue(e.target.value)
    },
    [openMenu, setInputValue]
  )

  const isDuplicateByValue = useCallback(
    (itemValue: string, excludeIndex?: number) => {
      const isDupe = selectedItemValues.some((v, idx) => idx !== excludeIndex && v === itemValue)
      return isDupe
    },
    [selectedItemValues]
  )

  const isDuplicateByText = useCallback(
    (text: string, excludeIndex?: number) => {
      return selectedItems.some((item, idx) => idx !== excludeIndex && getItemTextId(item.content).toLowerCase() === text.toLowerCase())
    },
    [selectedItems, getItemTextId]
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

  const validate = useCallback(
    (content: T): boolean => {
      const validationError = onValidate?.(content)
      if (validationError) {
        onValidationError?.(validationError)
        resetInput()
        return false
      }
      return true
    },
    [onValidate, onValidationError, resetInput]
  )

  const addSelectedItem = useCallback(
    (itemValue: string, removeIfDuplicate = false) => {
      if (isDuplicateByValue(itemValue)) {
        if (removeIfDuplicate) {
          removeItem(itemValue)
        }
        resetInput()
        return
      }

      const itemToAdd = items.find((i) => i.value === itemValue)
      if (!itemToAdd) return

      const newContent = onMutate(null, itemToAdd.content)

      // Validate the new item
      if (!validate(newContent)) return

      onItemAdded?.({ value: itemToAdd.value, content: newContent })
      resetInput()
    },
    [isDuplicateByValue, items, onItemAdded, resetInput, removeItem, onMutate, validate]
  )

  // Handle dropdown menu item click
  const handleDropdownItemClick = useCallback(
    (item: DropdownMenuItem) => {
      addSelectedItem(String(item.value), true)
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

  // Insert new item
  const insertNewItem = useCallback(
    (item: string) => {
      if (!allowNew) return
      if (isDuplicateByText(item)) {
        resetInput()
        return
      }
      // Generate value for new items with 'new-' prefix
      const newContent = onMutate(null, item)

      // Validate the new item
      if (!validate(newContent)) return

      const newItem = { value: 'new-' + item, content: newContent }
      onItemAdded?.(newItem)
      resetInput()
    },
    [onItemAdded, resetInput, allowNew, isDuplicateByText, onMutate, validate]
  )

  // Submit form
  const submitForm = useCallback(() => {
    if (!textInput) return
    const cleaned = textInput.trim()
    if (!cleaned) {
      resetInput()
    } else {
      const matchedItem = items.find((i) => i.content.toLowerCase() === cleaned.toLowerCase())
      if (matchedItem) {
        addSelectedItem(matchedItem.value, false)
      } else {
        insertNewItem(cleaned)
      }
    }
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
        .filter((item) => !isDuplicateByText(item))
        .map((item) => {
          const itemExists = items.find((i) => i.content.toLowerCase() === item.toLowerCase())
          if (itemExists) {
            return { value: itemExists.value, content: onMutate(null, itemExists.content) }
          } else {
            // Generate value for new items with 'new-' prefix
            return { value: 'new-' + item, content: onMutate(null, item) }
          }
        })
      if (itemsToAdd.length) {
        itemsToAdd.forEach((item) => {
          onItemAdded?.(item)
        })
        resetInput()
      }
    },
    [onItemAdded, items, resetInput, isDuplicateByText, onMutate]
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

  const handlePillEdit = useCallback(
    (editedPillItem: T, idx: number) => {
      const itemToUpdate = selectedItems[idx]
      if (itemToUpdate) {
        const newText = getItemTextId(editedPillItem)
        const isDupe = isDuplicateByText(newText, idx)
        if (isDupe) {
          onDuplicateError?.(`"${newText}" is already selected`)
          return
        }
        const updatedItem = { ...itemToUpdate, content: editedPillItem }
        onItemEdited?.(updatedItem, idx)
      }
    },
    [selectedItems, getItemTextId, isDuplicateByText, onDuplicateError, onItemEdited]
  )

  const handlePillEditDone = useCallback(
    (shouldRefocus = false, cancelled = false) => {
      setEditingPillIndex(null)
      if (shouldRefocus) {
        inputRef.current?.focus()
      }
      onEditDone?.(cancelled)
    },
    [setEditingPillIndex, onEditDone]
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
        const results = items.filter((i) => i.content.toLowerCase().includes(textInput.toLowerCase()))
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
      if (pillIdx >= 0) activeDescendantId = `${multiSelectId}-pill-${pillIdx}`
    } else {
      // menu item
      activeDescendantId = `${multiSelectId}-menuitem-${focusIndex}`
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
  const handleInputWrapperClick = useCallback(() => {
    if (disabled) return
    if (document.activeElement === inputRef.current) {
      setIsMenuOpen((prev) => !prev)
    }
  }, [disabled])

  const inputId = useMemo(() => `${multiSelectId}-input`, [multiSelectId])

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={inputId} disabled={disabled}>
          {label}
        </Label>
      )}
      <div ref={wrapperRef} className="relative">
        <InputWrapper disabled={disabled} inputRef={inputRef} size="auto">
          <div
            ref={inputWrapperRef}
            role="list"
            className={mergeClasses('flex-wrap relative w-full flex items-center py-1', disabled ? 'text-disabled cursor-not-allowed' : 'cursor-text')}
            onClick={handleInputWrapperClick}
            onMouseDown={(e) => e.preventDefault()}
          >
            {selectedItems.map((item, idx) => (
              <Pill
                key={item.value}
                id={`${multiSelectId}-pill-${idx}`}
                item={item.content}
                onMutate={onMutate}
                onValidate={onValidate}
                onValidationError={onValidationError}
                getEditableText={getEditableText}
                getReadOnlyPrefix={getReadOnlyPrefix}
                getFullText={getFullText}
                isFocused={focusIndex === idx - selectedItemValues.length}
                isEditing={editingPillIndex === idx}
                disabled={disabled}
                showEditButton={showEdit}
                onClick={() => focusPill(idx)}
                onEditButtonClick={() => setEditingPillIndex(idx)}
                onEdit={(editedPillItem) => handlePillEdit(editedPillItem, idx)}
                onRemove={() => removeItem(item.value)}
                onEditDone={handlePillEditDone}
              />
            ))}
            <span ref={sizerRef} className="absolute invisible whitespace-pre px-1 text-sm">
              {textInput}
            </span>
            <input
              value={isControlled ? value : textInput}
              ref={inputRef}
              id={inputId}
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
              aria-controls={`${multiSelectId}-listbox`}
              aria-haspopup="listbox"
              aria-disabled={disabled}
              aria-activedescendant={activeDescendantId}
              readOnly={!showInput}
            />
          </div>
        </InputWrapper>
        <DropdownMenu
          showMenu={showMenu}
          items={dropdownItems}
          multiSelect={true}
          focusedIndex={focusIndex !== null && focusIndex >= 0 ? focusIndex : -1}
          dropdownId={multiSelectId}
          onItemClick={handleDropdownItemClick}
          isItemSelected={isItemSelected}
          showSelectedIndicator={true}
          showNoItemsMessage={true}
          noItemsText={t('LabelNoItems')}
          menuMaxHeight="224px"
          className="z-60"
          triggerRef={inputWrapperRef as React.RefObject<HTMLElement>}
        />
      </div>
    </div>
  )
}

// Backward compatible default export for string-based usage
const MultiSelectString = MultiSelect<string>
export default MultiSelectString
