'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useItemPageEditMode } from '@/contexts/ItemPageEditModeContext'

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
  const { isPageEditMode: pageEditMode } = useItemPageEditMode()

  const t = useTypeSafeTranslations()
  const [isEditing, setIsEditing] = useState(openInEditMode)
  const [tempValue, setTempValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewContentRef = useRef<HTMLDivElement>(null)
  const lastTabDirection = useRef<'forward' | 'backward' | null>(null)
  const shouldIgnoreClickRef = useRef(false)
  const isMouseDownRef = useRef(false)
  const isProgrammaticFocusRef = useRef(false)
  const isShiftPressedRef = useRef(false)

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

    // Global listener to clear mouse down state
    const mouseUpHandler = () => {
      isMouseDownRef.current = false
    }
    window.addEventListener('mouseup', mouseUpHandler)

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = true
    }
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = false
    }
    window.addEventListener('keydown', keyDownHandler)
    window.addEventListener('keyup', keyUpHandler)

    return () => {
      mql.removeEventListener('change', handler)
      window.removeEventListener('touchstart', touchHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      window.removeEventListener('keydown', keyDownHandler)
      window.removeEventListener('keyup', keyUpHandler)
    }
  }, [])

  // Determine if editing is allowed based on pageEditMode
  // When pageEditMode is explicitly false, editing is disabled
  // When pageEditMode is true or undefined, use canEdit prop
  const isEditingAllowed = pageEditMode === false ? false : canEdit

  const handleStartEdit = useCallback(() => {
    if (!isEditingAllowed) return
    setTempValue(initialValue)
    setIsEditing(true)
  }, [isEditingAllowed, initialValue])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setTempValue(initialValue)
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
  // useLayoutEffect runs synchronously after DOM mutations, before paint
  useLayoutEffect(() => {
    if (!isEditing && lastTabDirection.current === 'forward') {
      lastTabDirection.current = null

      const interactive = viewContentRef.current?.querySelector<HTMLElement>(
        'a, button:not([tabindex="-1"]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (interactive) {
        isProgrammaticFocusRef.current = true
        interactive.focus()
        // queueMicrotask ensures the flag is cleared after focus event handlers run
        queueMicrotask(() => {
          isProgrammaticFocusRef.current = false
        })
      }
    }
  }, [isEditing])

  const handleFocus = (e: React.FocusEvent) => {
    setIsFocused(true)

    // In page view mode (pageEditMode === false), do not enter edit mode on focus
    if (pageEditMode === false) return

    if (isMobile) return

    if (!isEditing && isEditingAllowed) {
      // If focus landed on an interactive element inside view content, don't enter edit mode
      // This handles both programmatic focus (after save) and user clicking on links/buttons
      const target = e.target as HTMLElement
      const isOnInteractiveChild =
        viewContentRef.current?.contains(target) && target.matches('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (isOnInteractiveChild) return

      // Also check for programmatic focus flag (backup for edge cases)
      if (isProgrammaticFocusRef.current) return

      // Backward Tab (Shift+Tab) Entry Handling
      // If entering via Shift+Tab, we should try to focus the LAST interactive element in the view
      // instead of entering edit mode immediately.
      if (isShiftPressedRef.current) {
        // Use relatedTarget to determine if we are entering from outside or bubbling from inside
        const isEntering = !containerRef.current?.contains(e.relatedTarget as Node)

        // Check if we have interactive elements to redirect to
        const interactive = viewContentRef.current?.querySelectorAll(
          'a, button:not([tabindex="-1"]):not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )

        // If focus landed on the container (wrapper)
        if (target === containerRef.current) {
          if (interactive && interactive.length > 0) {
            if (isEntering) {
              // We entered from outside onto the container -> Redirect to last item
              const last = interactive[interactive.length - 1] as HTMLElement
              isProgrammaticFocusRef.current = true
              last.focus()
              queueMicrotask(() => {
                isProgrammaticFocusRef.current = false
              })
              return
            }
            // If we bubbled from inside loops, just return (don't auto-edit)
            // This allows Shift+Tab from the button to land on the container, then next Shift+Tab leaves the field.
            return
          }
          // If no interactive elements, allow fall-through to Auto-Edit (standard Backward Tab behavior)
        }

        // If focus landed on an internal interactive element (e.g. Firefox focused button directly)
        // We ensure we don't catch the container itself (which was handled above)
        if (target !== containerRef.current && containerRef.current?.contains(target)) {
          // We are rightfully on a child element in view mode -> Return (don't auto-edit)
          return
        }
      }

      // If the interaction that caused focus was NOT a mouse down (i.e. it was keyboard/tab),
      // we generally want to enter edit mode, regardless of where specifically focus landed (e.g. on a button).
      // If it WAS a mouse down (click), we respect the "don't edit if clicking a link/button" rule.
      if (isMouseDownRef.current) {
        // Prevent entering edit mode if focusing a button or link via Click
        if (target.closest('button') || target.closest('a')) {
          return
        }
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
      // In page view mode (pageEditMode === false), do not enter edit mode on key press
      if (pageEditMode === false) return

      // Prevent entering edit mode if focusing a button or link (e.g. "Read more")
      const target = e.target as HTMLElement
      if (target.closest('button') || target.closest('a')) {
        // Special Handling for Back-Tab (Shift+Tab) from the first interactive element
        // This ensures that shift+tabbing from the first element (e.g. "Read More" button)
        // correctly triggers edit mode instead of getting lost (as seen in Firefox)
        if (e.key === 'Tab' && e.shiftKey) {
          const interactive = viewContentRef.current?.querySelectorAll(
            'a, button:not([tabindex="-1"]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (interactive && interactive.length > 0) {
            const first = interactive[0]
            if (first === target || first.contains(target as Node)) {
              e.preventDefault()
              handleStartEdit()
            }
          }
        }
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

  const handleChange = useCallback((val: T) => {
    setTempValue(val)
  }, [])

  return (
    <div
      ref={containerRef}
      className={mergeClasses(
        'relative group flex items-center -ms-2 ps-2 rounded-sm transition-colors outline-none',
        isEditingAllowed && 'hover:bg-bg-hover/30',
        className
      )}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onMouseDownCapture={() => {
        isMouseDownRef.current = true
      }}
      // In page view mode (pageEditMode === false), field is not focusable via Tab
      tabIndex={isEditingAllowed && !isEditing ? 0 : -1}
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
        className={mergeClasses(
          'min-w-0 cursor-pointer w-full',
          isMobile && !isFocused ? 'pr-2' : 'pr-12',
          contentClassName,
          isEditing && 'absolute opacity-0 pointer-events-none h-0 overflow-hidden',
          isMobile && !isFocused && '[&_a]:pointer-events-none',
          isMobile && isFocused && '[&_a]:underline'
        )}
        onClick={(e) => {
          // In page view mode (pageEditMode === false), do not enter edit mode on click
          if (pageEditMode === false) return

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
          className={mergeClasses(
            'absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 transition-opacity duration-200',
            'opacity-0 pointer-events-none',
            // Show on hover (if allowed)
            isEditingAllowed && 'group-hover:opacity-100 group-hover:pointer-events-auto',
            // Show on mobile focus (if allowed)
            isEditingAllowed && isMobile && isFocused && 'opacity-100 pointer-events-auto'
          )}
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
