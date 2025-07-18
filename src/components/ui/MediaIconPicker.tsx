'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { AVAILABLE_ICONS, type AvailableIcon } from '@/lib/absicons'
import LibraryIcon from './LibraryIcon'
import { useClickOutside } from '@/hooks/useClickOutside'

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
export default function MediaIconPicker({ value, disabled = false, label = 'Icon', onChange, className = '', align = 'left' }: MediaIconPickerProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const openMenu = (index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
  }

  const closeMenu = () => {
    setShowMenu(false)
    setFocusedIndex(-1)
  }

  // Use the existing useClickOutside hook
  useClickOutside(containerRef, buttonRef, closeMenu)

  const selectedIcon = value || 'database'
  const validSelectedIcon = AVAILABLE_ICONS.includes(selectedIcon as AvailableIcon) ? (selectedIcon as AvailableIcon) : 'audiobookshelf'

  // Generate unique ID using React's useId hook
  const uniqueId = useId()
  const listboxId = `${uniqueId}-listbox`

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  const handleSelectIcon = (icon: AvailableIcon) => {
    if (disabled) return
    onChange?.(icon)
    closeMenu()
    // Return focus to the trigger button
    buttonRef.current?.focus()
  }

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
  }, [showMenu, focusedIndex, openMenu])

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

  const handleIconKeyDown = (event: React.KeyboardEvent, icon: AvailableIcon) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelectIcon(icon)
    }
  }

  // Convert icon name to readable text for screen readers
  const getIconReadableName = (icon: AvailableIcon) => {
    return icon.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Get menu alignment classes based on align prop
  const getMenuAlignmentClasses = () => {
    switch (align) {
      case 'right':
        return 'right-0'
      case 'center':
        return 'left-1/2 -translate-x-1/2'
      case 'left':
      default:
        return 'left-0'
    }
  }

  return (
    <div ref={containerRef} className={mergeClasses('relative w-fit h-9', className)}>
      <label htmlFor={uniqueId} className={mergeClasses('text-sm font-semibold block', disabled ? 'text-gray-300' : '')}>
        {label}
      </label>

      <button
        ref={buttonRef}
        id={uniqueId}
        type="button"
        disabled={disabled}
        className="relative h-full w-fit border border-gray-600 rounded-sm shadow-xs pl-3 pr-3 text-left cursor-pointer bg-primary text-gray-100 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={showMenu}
        aria-labelledby={`${uniqueId}-label`}
        aria-activedescendant={focusedIndex >= 0 ? `${uniqueId}-option-${focusedIndex}` : undefined}
        onClick={handleToggleMenu}
        onKeyDown={handleKeyDown}
      >
        <span id={`${uniqueId}-label`} className="sr-only">
          {label}: {getIconReadableName(validSelectedIcon)}
        </span>
        <LibraryIcon icon={validSelectedIcon} decorative={false} />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-label={`${label} options`}
          className={`absolute z-10 -mt-px bg-primary border border-black-200 shadow-lg max-h-56 w-48 rounded-md py-1 overflow-auto focus:outline-hidden sm:text-sm ${getMenuAlignmentClasses()}`}
          onKeyDown={handleKeyDown}
        >
          <div className="flex justify-center items-center flex-wrap">
            {AVAILABLE_ICONS.map((icon, index) => (
              <div
                key={icon}
                id={`${uniqueId}-option-${index}`}
                className={`p-2 cursor-pointer rounded ${focusedIndex === index ? 'text-white/100 hover:text-white/75' : 'text-white/50 hover:text-white/75'}`}
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
                  className={focusedIndex === index ? 'text-white/100 hover:text-white/75' : 'text-white/50 hover:text-white/75'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
