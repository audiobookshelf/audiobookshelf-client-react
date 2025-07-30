import React, { useState, useRef, useEffect, useCallback } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

interface PillProps {
  item: string
  id: string
  isFocused: boolean
  disabled: boolean
  showEditButton: boolean
  isEditing?: boolean
  onEditButtonClick?: () => void
  onClick: () => void
  onEdit?: (item: string) => void
  onRemove: (item: string) => void
  onEditDone?: (shouldRefocus?: boolean) => void
}

export const Pill: React.FC<PillProps> = ({
  item,
  id,
  isFocused,
  disabled,
  showEditButton,
  isEditing = false,
  onEditButtonClick,
  onClick,
  onEdit,
  onRemove,
  onEditDone
}) => {
  const [editValue, setEditValue] = useState(item)
  const [isInputReady, setIsInputReady] = useState(false)

  const editInputRef = useRef<HTMLInputElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const inputWidthRef = useRef<number>(20)
  const pillContainerRef = useRef<HTMLDivElement>(null)

  // Update edit value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(item)
    }
  }, [isEditing, item])

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
        if (editValue) {
          const sizerWidth = sizerRef.current.getBoundingClientRect().width
          const newWidth = Math.max(20, sizerWidth)
          inputWidthRef.current = newWidth
        } else {
          inputWidthRef.current = 20
        }
        setIsInputReady(true)
      }
    }
  }, [isEditing, editValue, isInputReady])

  // Update width while typing
  useEffect(() => {
    if (isEditing && sizerRef.current && isInputReady) {
      if (sizerRef.current) {
        const sizerWidth = sizerRef.current.getBoundingClientRect().width
        const newWidth = Math.max(20, sizerWidth)
        inputWidthRef.current = newWidth
        editInputRef.current?.style.setProperty('width', `${newWidth}px`)
      }
    }
  }, [editValue, isEditing, isInputReady])

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
    setEditValue(e.target.value)
  }, [])

  // Save the edit
  const handleSaveEdit = useCallback(() => {
    if (editValue.trim() && editValue !== item) {
      onEdit?.(editValue.trim())
    }
    onEditDone?.(true) // Refocus input when explicitly saving
  }, [editValue, item, onEdit, onEditDone])

  const handleCancelEdit = useCallback(() => {
    setEditValue(item)
    onEditDone?.(true)
  }, [item, onEditDone])

  // Handle input blur - only exit edit mode, don't save
  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const newFocusTarget = e.relatedTarget as HTMLElement

      // Only exit edit mode if focus is moving outside the pill container
      if (!pillContainerRef.current?.contains(newFocusTarget)) {
        onEditDone?.(false)
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
        aria-label={`Editing ${item}`}
        className={mergeClasses(
          'rounded-full px-2 py-1 mx-0.5 my-0.5 text-xs bg-bg flex flex-nowrap break-all items-center justify-center relative',
          'ring z-10'
        )}
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={handlePillKeyDown}
      >
        <span ref={sizerRef} className="absolute invisible whitespace-pre px-1 text-xs">
          {editValue}
        </span>
        {isInputReady && (
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={handleEditInputChange}
            onKeyDown={handleEditInputKeyDown}
            onBlur={handleInputBlur}
            className="bg-transparent border-none outline-none text-xs text-center flex-1"
            style={{ minWidth: '20px', width: `${inputWidthRef.current}px` }}
            autoComplete="off"
            aria-label={`Edit ${item}`}
            aria-describedby={`${id}-edit-instructions`}
          />
        )}
        <div className="flex items-center gap-1 ml-1" role="group" aria-label="Edit actions">
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
          Press Enter to save or Escape to cancel
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
        !disabled && isFocused ? 'ring z-10' : ''
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
        <div className="absolute top-0 -right-1 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
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
      <span className="relative group-hover:opacity-75 transition-opacity duration-300">{item}</span>
    </div>
  )
}

export default Pill
