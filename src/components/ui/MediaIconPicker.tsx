'use client'

import { useClickOutside } from '@/hooks/useClickOutside'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AVAILABLE_ICONS, type AvailableIcon } from '@/lib/absicons'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import ButtonBase from './ButtonBase'
import Label from './Label'
import LibraryIcon from './LibraryIcon'

interface MediaIconPickerProps {
  value?: string
  disabled?: boolean
  label?: string
  onChange?: (value: string) => void
  className?: string
  /** Menu alignment relative to the button */
  align?: 'left' | 'right' | 'center'
}

/**
 * A component that allows users to pick from available library icons.
 * Migrated from Vue component to React TypeScript.
 */
export default function MediaIconPicker({ value, disabled = false, label, onChange, className = '', align = 'left' }: MediaIconPickerProps) {
  const t = useTypeSafeTranslations()
  const [showMenu, setShowMenu] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const defaultLabel = label || t('LabelIcon')

  const openMenu = useCallback((index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
  }, [])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(-1)
  }, [])

  // Use the existing useClickOutside hook
  useClickOutside(containerRef, buttonRef, closeMenu)

  const selectedIcon = useMemo(() => (value ? value : 'database'), [value])
  const validSelectedIcon = useMemo(() => {
    if (AVAILABLE_ICONS.includes(selectedIcon as AvailableIcon)) {
      return selectedIcon as AvailableIcon
    }
    return 'audiobookshelf'
  }, [selectedIcon])

  // Generate unique ID using React's useId hook
  const mediaIconPickerId = useId()
  const listboxId = useMemo(() => `${mediaIconPickerId}-listbox`, [mediaIconPickerId])
  const buttonId = useMemo(() => `${mediaIconPickerId}-button`, [mediaIconPickerId])

  const handleToggleMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      if (showMenu) {
        closeMenu()
      } else {
        openMenu()
      }
    },
    [disabled, showMenu, openMenu, closeMenu]
  )

  const handleSelectIcon = useCallback(
    (icon: AvailableIcon) => {
      if (disabled) return
      onChange?.(icon)
      closeMenu()
      // Return focus to the trigger button
      buttonRef.current?.focus()
    },
    [disabled, onChange, closeMenu]
  )

  // Keyboard navigation handlers
  const handleVerticalNavigation = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'down') {
        if (!showMenu) {
          openMenu(0)
        } else {
          setFocusedIndex((prev) => (prev < AVAILABLE_ICONS.length - 1 ? prev + 1 : prev))
        }
      } else {
        if (!showMenu) {
          openMenu(AVAILABLE_ICONS.length - 1)
        } else {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
      }
    },
    [showMenu, openMenu]
  )

  const handleEnterSpace = useCallback(() => {
    if (!showMenu) {
      openMenu()
    } else if (focusedIndex >= 0) {
      handleSelectIcon(AVAILABLE_ICONS[focusedIndex])
    }
  }, [showMenu, focusedIndex, openMenu, handleSelectIcon])

  const handleEscape = useCallback(() => {
    closeMenu()
    buttonRef.current?.focus()
  }, [closeMenu])

  const handleHomeEnd = useCallback(
    (key: 'home' | 'end') => {
      if (showMenu) {
        if (key === 'home') {
          setFocusedIndex(0)
        } else {
          setFocusedIndex(AVAILABLE_ICONS.length - 1)
        }
      }
    },
    [showMenu]
  )

  const handleTab = useCallback(() => {
    if (showMenu) {
      closeMenu()
    }
  }, [showMenu, closeMenu])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault()
          handleVerticalNavigation('down')
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault()
          handleVerticalNavigation('up')
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          handleEnterSpace()
          break
        case 'Escape':
          event.preventDefault()
          handleEscape()
          break
        case 'Home':
          event.preventDefault()
          handleHomeEnd('home')
          break
        case 'End':
          event.preventDefault()
          handleHomeEnd('end')
          break
        case 'Tab':
          handleTab()
          break
      }
    },
    [disabled, handleVerticalNavigation, handleEnterSpace, handleEscape, handleHomeEnd, handleTab]
  )

  const handleIconKeyDown = useCallback(
    (event: React.KeyboardEvent, icon: AvailableIcon) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleSelectIcon(icon)
      }
    },
    [handleSelectIcon]
  )

  // Get menu alignment classes based on align prop
  const getMenuAlignmentClasses = useCallback(() => {
    switch (align) {
      case 'right':
        return 'end-0'
      case 'center':
        return 'start-1/2 -translate-x-1/2'
      case 'left':
      default:
        return 'start-0'
    }
  }, [align])

  // Convert icon name to readable text for screen readers
  const getIconReadableName = useCallback((icon: AvailableIcon) => {
    return icon.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }, [])

  const validSelectedIconReadableName = useMemo(() => getIconReadableName(validSelectedIcon), [validSelectedIcon, getIconReadableName])

  const ariaLabel = useMemo(
    () => (defaultLabel ? `${defaultLabel}: ${validSelectedIconReadableName}` : validSelectedIconReadableName),
    [defaultLabel, validSelectedIconReadableName]
  )

  const buttonClass = useMemo(() => {
    return 'w-10'
  }, [])

  return (
    <div className={mergeClasses('relative', className)}>
      <Label htmlFor={buttonId} disabled={disabled}>
        {defaultLabel}
      </Label>

      <div className="relative w-fit" ref={containerRef}>
        <ButtonBase
          ref={buttonRef}
          id={buttonId}
          size="medium"
          disabled={disabled}
          className={buttonClass}
          aria-haspopup="listbox"
          aria-expanded={showMenu}
          aria-label={ariaLabel}
          aria-activedescendant={focusedIndex >= 0 ? `${mediaIconPickerId}-option-${focusedIndex}` : undefined}
          onClick={handleToggleMenu}
          onKeyDown={handleKeyDown}
        >
          <LibraryIcon icon={validSelectedIcon} decorative={false} />
        </ButtonBase>

        {showMenu && (
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={t('LabelIconOptions', { label: defaultLabel })}
            className={`absolute z-10 mt-0.5 bg-primary border border-dropdown-menu-border shadow-lg max-h-56 w-48 rounded-md py-1 overflow-auto focus:outline-hidden sm:text-sm ${getMenuAlignmentClasses()}`}
            onKeyDown={handleKeyDown}
          >
            <div className="flex justify-center items-center flex-wrap">
              {AVAILABLE_ICONS.map((icon, index) => (
                <div
                  key={icon}
                  id={`${mediaIconPickerId}-option-${index}`}
                  className={`p-2 cursor-pointer rounded ${
                    focusedIndex === index ? 'text-foreground/100 hover:text-foreground/75' : 'text-foreground/50 hover:text-foreground/75'
                  }`}
                  role="option"
                  aria-selected={icon === validSelectedIcon}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectIcon(icon)}
                  onKeyDown={(e) => handleIconKeyDown(e, icon)}
                  tabIndex={-1}
                >
                  <LibraryIcon
                    icon={icon}
                    decorative={false}
                    className={focusedIndex === index ? 'text-foreground/100 hover:text-foreground/75' : 'text-foreground/50 hover:text-foreground/75'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
