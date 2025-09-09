'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { useGlobalToast } from '@/contexts/ToastContext'

interface PillProps<T> {
  item: T
  id: string
  isFocused: boolean
  disabled: boolean
  showEditButton: boolean
  isEditing?: boolean
  getEditableText?: (item: T) => string
  getReadOnlyPrefix?: (item: T) => string
  getFullText?: (item: T) => string
  onMutate?: (prev: T | null, value: string) => T
  onValidate?: (content: T) => string | null
  onEditButtonClick?: () => void
  onClick: () => void
  onEdit?: (item: T) => void
  onRemove: (item: T) => void
  onEditDone?: (shouldRefocus?: boolean, cancelled?: boolean) => void
}

export const Pill = <T,>({
  item,
  id,
  isFocused,
  disabled,
  showEditButton,
  isEditing = false,
  getEditableText,
  getReadOnlyPrefix,
  getFullText,
  onMutate,
  onValidate,
  onEditButtonClick,
  onClick,
  onEdit,
  onRemove,
  onEditDone
}: PillProps<T>) => {
  const { showToast } = useGlobalToast()
  const [isInputReady, setIsInputReady] = useState(false)
  const [hasValidationError, setHasValidationError] = useState(false)

  const itemText = useMemo(() => (getEditableText ? getEditableText(item) : String(item)), [getEditableText, item])
  const readOnlyPrefix = useMemo(() => (getReadOnlyPrefix ? getReadOnlyPrefix(item) : undefined), [getReadOnlyPrefix, item])
  const fullText = useMemo(() => (getFullText ? getFullText(item) : itemText), [getFullText, itemText, item])

  const [inputValue, setInputValue] = useState(itemText)

  const editInputRef = useRef<HTMLInputElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const prefixRef = useRef<HTMLSpanElement>(null)
  const inputWidthRef = useRef<number>(0)
  const pillContainerRef = useRef<HTMLDivElement>(null)

  // Update input value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // itemText is now the editable portion
      setInputValue(itemText)
    }
  }, [isEditing, itemText])

  const updatePillMaxWidth = useCallback(() => {
    if (pillContainerRef.current) {
      const pillElement = pillContainerRef.current
      const parentElement = pillElement.parentElement
      if (!parentElement) return

      const parentStyle = window.getComputedStyle(parentElement)
      const parentPaddingLeft = parseFloat(parentStyle.paddingLeft)
      const parentPaddingRight = parseFloat(parentStyle.paddingRight)
      const parentContentWidth = parentElement.clientWidth - parentPaddingLeft - parentPaddingRight

      const pillStyle = window.getComputedStyle(pillElement)
      const pillMarginLeft = parseFloat(pillStyle.marginLeft)
      const pillMarginRight = parseFloat(pillStyle.marginRight)

      const maxPillWidth = parentContentWidth - pillMarginLeft - pillMarginRight
      pillElement.style.maxWidth = `${maxPillWidth}px`
    }
  }, [])

  // Dynamically calculate and set the max width for the pill container, and update on resize.
  useEffect(() => {
    if (isEditing) {
      updatePillMaxWidth()
      window.addEventListener('resize', updatePillMaxWidth)

      return () => {
        window.removeEventListener('resize', updatePillMaxWidth)
        if (pillContainerRef.current) {
          pillContainerRef.current.style.maxWidth = ''
        }
      }
    }
  }, [isEditing, updatePillMaxWidth])

  // Focus the edit input when editing starts and input is rendered
  useEffect(() => {
    if (isEditing && editInputRef.current && isInputReady) {
      editInputRef.current.focus()
      //editInputRef.current.select()
    }
  }, [isEditing, isInputReady])

  // Calculate input width and prepare input for rendering
  useEffect(() => {
    if (isEditing && sizerRef.current && !isInputReady) {
      if (sizerRef.current) {
        if (inputValue) {
          const sizerWidth = sizerRef.current.getBoundingClientRect().width
          const newWidth = sizerWidth
          inputWidthRef.current = newWidth
        } else {
          inputWidthRef.current = 0
        }
        setIsInputReady(true)
      }
    }
  }, [isEditing, inputValue, isInputReady])

  // Update width while typing
  useEffect(() => {
    if (isEditing && sizerRef.current && isInputReady) {
      if (sizerRef.current) {
        const sizerWidth = sizerRef.current.getBoundingClientRect().width
        const newWidth = sizerWidth
        inputWidthRef.current = newWidth
        editInputRef.current?.style.setProperty('width', `${newWidth}px`)
      }
    }
  }, [inputValue, isEditing, isInputReady])

  // Start editing when edit button is clicked
  const handleEditButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled && showEditButton) {
        onEditButtonClick?.()
      }
    },
    [disabled, showEditButton, onEditButtonClick]
  )

  // Handle edit input changes
  const handleEditInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  // Save the edit
  const handleSaveEdit = useCallback(() => {
    const trimmedInput = inputValue.trim()
    const newContent = onMutate ? onMutate(item, trimmedInput) : (trimmedInput as T)

    // Validate the new content
    if (onValidate) {
      const error = onValidate(newContent)
      if (error) {
        setHasValidationError(true)
        showToast(error, { type: 'error', title: 'Validation Error' })
        return
      } else {
        setHasValidationError(false)
      }
    }

    const isEmpty = getFullText ? getFullText(newContent) === '' : trimmedInput === ''

    if (!isEmpty) {
      onEdit?.(newContent)
    }

    onEditDone?.(true, false) // Refocus input when explicitly saving
  }, [inputValue, onEdit, onEditDone, onMutate, onValidate, item, getFullText])

  const handleCancelEdit = useCallback(() => {
    // Reset to the original itemText
    setInputValue(itemText)
    setHasValidationError(false)
    onEditDone?.(true, true)
  }, [itemText, onEditDone])

  // Handle input blur - only exit edit mode, don't save
  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const newFocusTarget = e.relatedTarget as HTMLElement

      // Only exit edit mode if focus is moving outside the pill container
      if (!pillContainerRef.current?.contains(newFocusTarget)) {
        onEditDone?.(false, true)
      }
    },
    [onEditDone]
  )

  // Handle edit input key events
  const handleEditInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSaveEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancelEdit()
      }
    },
    [handleSaveEdit, handleCancelEdit]
  )

  // Tab trap for edit mode
  const handlePillKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()

      // Get all focusable elements in the edit mode
      const focusableElements = [editInputRef.current, cancelButtonRef.current, saveButtonRef.current].filter(Boolean) as HTMLElement[]

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
      const nextIndex = e.shiftKey ? (currentIndex - 1 + focusableElements.length) % focusableElements.length : (currentIndex + 1) % focusableElements.length

      focusableElements[nextIndex]?.focus()
    }
  }, [])

  // If editing, show the input field
  if (isEditing) {
    return (
      <div
        ref={pillContainerRef}
        id={id}
        cy-id={id}
        role="listitem"
        aria-label={`Editing ${readOnlyPrefix ? readOnlyPrefix + itemText : itemText}`}
        className={mergeClasses(
          'rounded-full px-2 py-1 mx-0.5 my-0.5 text-xs bg-bg flex flex-nowrap break-all items-center justify-center relative',
          'ring z-10',
          hasValidationError && 'ring-red-500 ring-2'
        )}
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={handlePillKeyDown}
      >
        <span ref={sizerRef} className="absolute invisible whitespace-pre px-1 text-xs">
          {inputValue}
        </span>
        <div className="inline" style={{ maxWidth: '85%' }}>
          {readOnlyPrefix && (
            <span ref={prefixRef} className="text-disabled text-xs">
              {readOnlyPrefix}
            </span>
          )}
          {isInputReady && (
            <input
              ref={editInputRef}
              type="text"
              value={inputValue}
              onChange={handleEditInputChange}
              onKeyDown={handleEditInputKeyDown}
              onBlur={handleInputBlur}
              className="bg-transparent border-none outline-none text-xs text-center"
              style={{ minWidth: '0px', width: `${inputWidthRef.current}px`, maxWidth: '100%', marginLeft: '-3px' }}
              autoComplete="off"
              aria-label={`Edit ${readOnlyPrefix ? 'editable portion of ' : ''}${readOnlyPrefix ? readOnlyPrefix + itemText : itemText}`}
              aria-describedby={`${id}-edit-instructions`}
            />
          )}
        </div>
        <div className="flex items-center gap-1 ms-1" role="group" aria-label="Edit actions">
          <button
            type="button"
            aria-label="Cancel edit"
            className="material-symbols text-white focus:text-error hover:text-error cursor-pointer"
            style={{ fontSize: '1rem' }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancelEdit}
            ref={cancelButtonRef}
          >
            close
          </button>
          <button
            type="button"
            aria-label="Save edit"
            className="material-symbols text-white focus:text-success hover:text-success cursor-pointer"
            style={{ fontSize: '1rem' }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSaveEdit}
            ref={saveButtonRef}
          >
            check
          </button>
        </div>
        <div id={`${id}-edit-instructions`} className="sr-only">
          {readOnlyPrefix
            ? `Editing text after prefix "${readOnlyPrefix}". Press Enter to save or Escape to cancel`
            : 'Press Enter to save or Escape to cancel'}
        </div>
      </div>
    )
  }

  return (
    <div
      id={id}
      cy-id={id}
      role="listitem"
      className={mergeClasses(
        'group rounded-full px-2 py-1 mx-0.5 my-0.5 text-xs bg-bg flex flex-nowrap break-all items-center justify-center relative',
        !disabled && isFocused ? 'ring z-10' : '',
        hasValidationError && 'ring-error ring-2'
      )}
      style={{ minWidth: showEditButton ? 44 : 22 }}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
    >
      {!disabled && (
        <div className="absolute top-0 -end-1 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          {showEditButton && (
            <button
              type="button"
              aria-label="Edit"
              className="material-symbols flex h-3 w-3 items-center justify-center rounded-full bg-bg-alt text-sm text-white hover:text-warning cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleEditButtonClick}
              tabIndex={-1}
            >
              edit
            </button>
          )}
          <button
            type="button"
            aria-label="Remove"
            className="material-symbols flex h-3 w-3 items-center justify-center rounded-full bg-bg-alt text-sm text-white hover:text-error focus:text-error cursor-pointer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item)
            }}
            tabIndex={-1}
          >
            close
          </button>
        </div>
      )}
      <span className="relative group-hover:opacity-75 transition-opacity duration-300">{fullText}</span>
    </div>
  )
}

export default Pill
