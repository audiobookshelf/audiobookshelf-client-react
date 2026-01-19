'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

interface EditableFieldProps<T> {
  value: T
  renderView: (props: { value: T }) => ReactNode
  renderEdit: (props: { value: T; onChange: (val: T) => void; onSave: () => void; onCancel: () => void; isLoading: boolean }) => ReactNode
  onSave: (val: T) => Promise<void>
  canEdit?: boolean
  className?: string
  contentClassName?: string
  openInEditMode?: boolean
  onCancel?: () => void
}

export function EditableField<T>({
  value: initialValue,
  renderView,
  renderEdit,
  onSave,
  canEdit = true,
  className = '',
  contentClassName = '',
  openInEditMode = false,
  onCancel
}: EditableFieldProps<T>) {
  const t = useTypeSafeTranslations()
  const [isEditing, setIsEditing] = useState(openInEditMode)
  const [tempValue, setTempValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  // Track if we are hovering to show the edit button (in view mode)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewContentRef = useRef<HTMLDivElement>(null)
  const lastTabDirection = useRef<'forward' | 'backward' | null>(null)
  const shouldIgnoreClickRef = useRef(false)

  // Sync temp value when initial value changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setTempValue(initialValue)
    }
  }, [initialValue, isEditing])

  // React to openInEditMode prop changes
  useEffect(() => {
    if (openInEditMode) {
      setIsEditing(true)
    }
  }, [openInEditMode])

  // Detect Mobile
  useEffect(() => {
    // Check for coarse pointer (typical for touch devices)
    const mql = window.matchMedia('(pointer: coarse)')
    if (mql.matches) setIsMobile(true)

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMobile(true)
    }
    mql.addEventListener('change', handler)

    // Fallback: Detect actual touch interaction
    // This catches devices that might misreport capabilities or hybrid devices used in touch mode
    const touchHandler = () => {
      setIsMobile(true)
      // Once confirmed as mobile usage, we don't need to listen anymore
      window.removeEventListener('touchstart', touchHandler)
    }
    window.addEventListener('touchstart', touchHandler)

    return () => {
      mql.removeEventListener('change', handler)
      window.removeEventListener('touchstart', touchHandler)
    }
  }, [])

  const handleStartEdit = useCallback(() => {
    if (!canEdit) return
    setTempValue(initialValue)
    setIsEditing(true)
  }, [canEdit, initialValue])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setTempValue(initialValue)
    setIsHovered(false)
    setIsFocused(false) // Clear focus state on cancel
    onCancel?.()
  }, [initialValue, onCancel])

  // Wrap handleSave in useCallback to stabilize it
  const handleSave = useCallback(async () => {
    // Check if value actually changed
    if (JSON.stringify(tempValue) === JSON.stringify(initialValue)) {
      handleCancel()
      return
    }

    setIsLoading(true)
    try {
      await onSave(tempValue)
      setIsEditing(false)
      setIsHovered(false)
    } catch (error) {
      console.error('Failed to save field', error)
    } finally {
      setIsLoading(false)
    }
  }, [tempValue, initialValue, onSave, handleCancel])

  // Custom click outside logic to handle Portal Modals (e.g. Link Modal)
  useEffect(() => {
    if (!isEditing) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement

      // If clicked inside the editor container, do nothing
      if (containerRef.current?.contains(target)) return

      // If clicked inside a Slate Modal (Portal), do nothing
      if (target.closest('[data-slate-editor-modal="true"]')) return

      // Otherwise, save
      handleSave()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [isEditing, handleSave])

  // Focus management after switching to view mode
  useEffect(() => {
    if (!isEditing && lastTabDirection.current === 'forward') {
      lastTabDirection.current = null
      // Attempt to focus the first interactive element in view mode
      // We use a small timeout to allow any renders/unhides to process if needed
      setTimeout(() => {
        const interactive = viewContentRef.current?.querySelector('a, button:not([tabindex="-1"]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (interactive) {
          ;(interactive as HTMLElement).focus()
        }
      }, 50)
    }
  }, [isEditing])

  const handleFocus = (e: React.FocusEvent) => {
    setIsFocused(true)

    if (isMobile) return

    if (!isEditing && canEdit) {
      const target = e.target as HTMLElement
      // Prevent entering edit mode if focusing a button or link
      if (target.closest('button') || target.closest('a')) {
        return
      }
      handleStartEdit()
    }
  }

  // We keep handleBlur for Tab navigation support, but strict checking prevents double-saves or issues
  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return

    // Check for modal interaction
    if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('[data-slate-editor-modal="true"]')) return

    setIsFocused(false)

    if (isEditing) {
      handleSave()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return

    if (!isEditing) {
      // Prevent entering edit mode if focusing a button or link (e.g. "Read more")
      const target = e.target as HTMLElement
      if (target.closest('button') || target.closest('a')) {
        return
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleStartEdit()
      }
      return
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      // Forward Tab: Check if we have links in view mode to visit
      const hasInteractive = viewContentRef.current?.querySelector('a, button:not([tabindex="-1"]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (hasInteractive) {
        e.preventDefault()
        lastTabDirection.current = 'forward'
        handleSave()
        return
      }
      // If no interactive elements, let default Tab occur (moves focus to next element), then blur will save.
    }

    if (e.key === 'Escape') {
      e.stopPropagation() // Prevent closing parent modals if any
      handleCancel()
    } else if (e.key === 'Enter') {
      // If the target is a textarea or contentEditable (Slate), let it handle newlines
      // Otherwise, save
      const target = e.target as HTMLElement
      const isContentEditable = target.isContentEditable || target.getAttribute('contenteditable') === 'true'

      if (target.tagName !== 'TEXTAREA' && !isContentEditable && !e.shiftKey) {
        // We allow Shift+Enter for potential multiline logic if needed in inputs, mostly just Enter saves.
        e.preventDefault()
        handleSave()
      }
    }
  }

  const showEditButton = canEdit && (isHovered || (isMobile && isFocused))

  const handleChange = useCallback((val: T) => {
    setTempValue(val)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative group flex items-center -ms-2 ps-2 rounded-sm hover:bg-bg-hover/30 transition-colors ${className} outline-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      tabIndex={canEdit && !isEditing ? 0 : undefined}
      onTouchStart={() => {
        // Capture focus state BEFORE any ephemeral focus events fire (which might be triggered by the touch)
        // If we are NOT focused yet, this touch should just focus us and we should ignore the subsequent click for editing
        if (!isFocused) {
          shouldIgnoreClickRef.current = true
        } else {
          shouldIgnoreClickRef.current = false
        }
      }}
    >
      {/* Edit Mode Content */}
      {isEditing && (
        <div className="w-full flex items-start gap-2">
          <div className="flex-grow min-w-0">
            {renderEdit({
              value: tempValue,
              onChange: handleChange,
              onSave: handleSave,
              onCancel: handleCancel,
              isLoading
            })}
          </div>
          {isLoading && (
            <div className="flex items-center justify-center p-2">
              <span className="loading loading-spinner loading-xs text-primary"></span>
            </div>
          )}
        </div>
      )}

      {/* View Mode Content (Hidden when editing, but present for querying) */}
      <div
        ref={viewContentRef}
        className={`min-w-0 ${isMobile && !isFocused ? 'pr-2' : 'pr-12'} ${contentClassName} cursor-pointer w-full ${isEditing ? 'absolute top-0 left-0 w-full opacity-0 pointer-events-none -z-50 h-0 overflow-hidden' : ''} ${
          isMobile && !isFocused ? '[&_a]:pointer-events-none' : ''
        } ${isMobile && isFocused ? '[&_a]:underline' : ''}`}
        onClick={(e) => {
          const target = e.target as HTMLElement
          const isLinkOrBtn = target.closest('a') || target.closest('button')

          // Check mobile logic using our sturdy ref (immune to react render races)
          if (isMobile && shouldIgnoreClickRef.current) {
            // Reset it just in case, though touchStart usually handles it
            shouldIgnoreClickRef.current = false
            return
          }

          if (isLinkOrBtn) return // Let default internal navigation happen

          handleStartEdit()
        }}
      >
        {renderView({ value: initialValue })}
      </div>

      {/* Edit Trigger Button - visible on hover (View Mode only) */}
      {!isEditing && (
        <div
          className={`absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 transition-opacity duration-200 ${showEditButton ? 'opacity-100' : 'opacity-0'} ${
            !showEditButton ? 'pointer-events-none' : ''
          }`}
        >
          <IconBtn
            size="custom"
            onClick={(e) => {
              e.stopPropagation()
              handleStartEdit()
            }}
            className="w-6 h-6 text-base text-foreground-muted hover:text-foreground hover:bg-bg-hover"
            ariaLabel={t('ButtonEdit')}
            tabIndex={-1}
          >
            edit
          </IconBtn>
        </div>
      )}
    </div>
  )
}
