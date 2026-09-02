'use client'

import { createAdditionalInsideCheck, useClickOutside } from '@/hooks/useClickOutside'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import DropdownMenu, { DropdownItemLabel, DropdownMenuItem } from './DropdownMenu'
import IconBtn from './IconBtn'
import InputWrapper from './InputWrapper'
import Label from './Label'

const CLEAR_ITEM_VALUE = '__dropdown_clear__'

export interface DropdownSubitem {
  text: string
  value: string | number
}

export interface DropdownItem {
  text: string
  value: string | number
  subtext?: string
  keepOpen?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  disabled?: boolean
  /** Accessible name for the menu row (e.g. when visible text is not enough) */
  ariaLabel?: string
  /** Subitems for two-level menu support */
  subitems?: DropdownSubitem[]
}

interface DropdownProps {
  value?: string | number
  label?: string
  /** Accessible name for the trigger (does not render a visible label) */
  ariaLabel?: string
  items?: DropdownItem[]
  disabled?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  menuMaxHeight?: string
  onChange?: (value: string | number) => void
  className?: string
  rightIcon?: React.ReactNode
  highlightSelected?: boolean
  /** Override the display text shown in the dropdown button */
  displayText?: string
  /** Use portal to render the dropdown menu. Useful for avoiding clipping issues. */
  usePortal?: boolean
  /** When true, menu item labels wrap up to two lines then truncate */
  wrapText?: boolean
  /** Icon shown instead of the full box on mobile widths */
  mobileIcon?: string
  onClear?: () => void
}

/**
 * A dropdown component that displays a list of selectable items.
 * The dropdown shows the selected item and allows users to choose from a list of options.
 * Supports two-level submenus with proper keyboard navigation.
 */
export default function Dropdown({
  value,
  label = '',
  ariaLabel,
  items = [],
  disabled = false,
  size = 'medium',
  menuMaxHeight = '224px',
  onChange,
  className,
  rightIcon,
  highlightSelected = false,
  displayText,
  usePortal = false,
  wrapText = false,
  mobileIcon,
  onClear
}: DropdownProps) {
  const t = useTypeSafeTranslations()
  const [showMenu, setShowMenu] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [focusedSubIndex, setFocusedSubIndex] = useState(-1)
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null)
  // Type-to-filter for submenus
  const [submenuFilterText, setSubmenuFilterText] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const controlWrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  // Generate unique ID for this dropdown instance
  const dropdownId = useId()
  const isMobile = useIsMobile() && !!mobileIcon

  const openMenu = (index: number = 0) => {
    setShowMenu(true)
    setFocusedIndex(index)
    setFocusedSubIndex(-1)
    setOpenSubmenuIndex(null)
  }

  // Keep useCallback for closeMenu since it's used in useClickOutside hook dependency
  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(-1)
    setFocusedSubIndex(-1)
    setOpenSubmenuIndex(null)
  }, [])

  // data-dropdown-id is used to identify portaled submenus as "inside" the dropdown
  const isInsideSubmenu = useMemo(() => createAdditionalInsideCheck('data-dropdown-id', dropdownId), [dropdownId])

  useClickOutside(menuRef, buttonRef, closeMenu, true, isInsideSubmenu)

  const toggleMenu = () => {
    if (disabled) return
    if (showMenu) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  const openSubMenu = (index: number, menuItems: DropdownItem[]) => {
    const currentItem = menuItems[index]
    setOpenSubmenuIndex(index)
    // Only set focusedSubIndex to 0 if there are actual subitems
    if (currentItem?.subitems && currentItem.subitems.length > 0) {
      setFocusedSubIndex(0)
    } else {
      setFocusedSubIndex(-1)
    }
  }

  const closeSubMenu = () => {
    setOpenSubmenuIndex(null)
    setFocusedSubIndex(-1)
    setSubmenuFilterText('')
  }

  const handleOptionClick = (item: DropdownItem) => {
    if (onClear && item.value === CLEAR_ITEM_VALUE) {
      onClear()
      closeMenu()
      return
    }
    onChange?.(item.value)

    const clickedItem = items.find((i) => (typeof i === 'object' ? i.value === item.value : i === item.value))
    if (typeof clickedItem === 'object' && clickedItem.keepOpen) {
      return
    }

    closeMenu()
  }

  const handleSubitemClick = (subitemValue: string | number) => {
    onChange?.(subitemValue)
    closeMenu()
  }

  const mappedItems = useMemo(
    () =>
      items.map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return {
            text: String(item),
            value: item
          }
        }
        return item
      }),
    [items]
  )

  const selectedItem = mappedItems.find((item) => item.value === value)
  // Use displayText if provided, otherwise fall back to selected item text
  const selectedText = displayText || selectedItem?.text || ''
  const selectedSubtext = displayText ? '' : selectedItem?.subtext || ''

  const itemsToShow = useMemo((): DropdownItem[] => {
    if (!onClear) return mappedItems
    return [
      {
        text: selectedText,
        value: CLEAR_ITEM_VALUE,
        ariaLabel: t('ButtonClearFilter'),
        rightIcon: (
          <span className="material-symbols text-base" aria-hidden="true">
            close
          </span>
        )
      },
      ...mappedItems
    ]
  }, [onClear, mappedItems, selectedText, t])

  let longLabel = ''
  if (label) longLabel += label + ': '
  if (selectedText) longLabel += selectedText
  if (selectedSubtext) longLabel += ' ' + selectedSubtext

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMenu()
  }

  // Helper to get filtered subitems for the currently open submenu
  const getFilteredSubitems = useCallback(() => {
    if (openSubmenuIndex === null) return []
    const currentItem = itemsToShow[openSubmenuIndex]
    if (!currentItem?.subitems) return []
    if (!submenuFilterText) return currentItem.subitems
    return currentItem.subitems.filter((subitem) => subitem.text.toLowerCase().startsWith(submenuFilterText.toLowerCase()))
  }, [itemsToShow, openSubmenuIndex, submenuFilterText])

  // Keyboard navigation handlers
  const handleVerticalNavigation = (direction: 'up' | 'down') => {
    if (direction === 'down') {
      if (!showMenu) {
        openMenu()
      } else if (focusedSubIndex !== -1 && openSubmenuIndex !== null) {
        // Navigating within submenu - use filtered list
        const filteredSubitems = getFilteredSubitems()
        if (filteredSubitems.length > 0) {
          setFocusedSubIndex((prev) => (prev < filteredSubitems.length - 1 ? prev + 1 : prev))
        }
      } else {
        closeSubMenu()
        setFocusedIndex((prev) => (prev < itemsToShow.length - 1 ? prev + 1 : prev))
      }
    } else {
      if (!showMenu) {
        openMenu(itemsToShow.length - 1)
      } else if (focusedSubIndex !== -1 && openSubmenuIndex !== null) {
        // Navigating within submenu - use filtered list
        const filteredSubitems = getFilteredSubitems()
        if (filteredSubitems.length > 0) {
          setFocusedSubIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
      } else {
        closeSubMenu()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      }
    }
  }

  const handleHorizontalNavigation = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Open submenu if current item has subitems
      if (showMenu && focusedSubIndex === -1 && focusedIndex >= 0) {
        const currentItem = itemsToShow[focusedIndex]
        if (currentItem?.subitems) {
          openSubMenu(focusedIndex, itemsToShow)
        }
      }
    } else {
      // Close submenu
      if (showMenu && openSubmenuIndex !== null) {
        closeSubMenu()
      }
    }
  }

  const handleEnterSpace = () => {
    if (!showMenu) {
      openMenu()
    } else if (focusedSubIndex !== -1 && focusedSubIndex >= 0 && openSubmenuIndex !== null) {
      // Select subitem from filtered list
      const filteredSubitems = getFilteredSubitems()
      if (filteredSubitems.length > 0 && focusedSubIndex < filteredSubitems.length) {
        const subitem = filteredSubitems[focusedSubIndex]
        if (subitem) {
          handleSubitemClick(subitem.value)
        }
      }
    } else if (focusedIndex >= 0 && focusedIndex < itemsToShow.length) {
      const currentItem = itemsToShow[focusedIndex]
      if (currentItem?.subitems) {
        // Toggle submenu
        if (openSubmenuIndex === focusedIndex) {
          closeSubMenu()
        } else {
          openSubMenu(focusedIndex, itemsToShow)
        }
      } else {
        handleOptionClick(itemsToShow[focusedIndex])
      }
    }
  }

  const handleEscape = () => {
    if (openSubmenuIndex !== null) {
      closeSubMenu()
    } else {
      closeMenu()
      buttonRef.current?.focus()
    }
  }

  const handleHomeEnd = (key: 'home' | 'end') => {
    if (showMenu) {
      if (key === 'home') {
        if (focusedSubIndex !== -1) {
          setFocusedSubIndex(0)
        } else {
          closeSubMenu()
          setFocusedIndex(0)
        }
      } else {
        if (focusedSubIndex !== -1 && openSubmenuIndex !== null) {
          const filteredSubitems = getFilteredSubitems()
          if (filteredSubitems.length > 0) {
            setFocusedSubIndex(filteredSubitems.length - 1)
          }
        } else {
          closeSubMenu()
          setFocusedIndex(itemsToShow.length - 1)
        }
      }
    }
  }

  const handleTab = () => {
    if (showMenu) {
      closeMenu()
    }
  }

  // Handle type-to-filter for submenu
  const handleTypeToFilter = (key: string) => {
    if (openSubmenuIndex !== null) {
      // Add character to filter and reset focus to first item
      setSubmenuFilterText((prev) => prev + key.toLowerCase())
      setFocusedSubIndex(0)
    }
  }

  const handleBackspace = () => {
    if (openSubmenuIndex !== null && submenuFilterText.length > 0) {
      setSubmenuFilterText((prev) => prev.slice(0, -1))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

      case 'ArrowRight':
        e.preventDefault()
        handleHorizontalNavigation('right')
        break

      case 'ArrowLeft':
        e.preventDefault()
        handleHorizontalNavigation('left')
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        handleEnterSpace()
        break

      case 'Escape':
        e.preventDefault()
        if (showMenu || openSubmenuIndex !== null) {
          e.stopPropagation()
          handleEscape()
        }
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

      case 'Backspace':
        e.preventDefault()
        handleBackspace()
        break

      default:
        // Handle letters and numbers for type-to-filter in submenu (supports Unicode)
        if (e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key)) {
          e.preventDefault()
          handleTypeToFilter(e.key)
        }
        break
    }
  }

  const dropdownMenuItems: DropdownMenuItem[] = itemsToShow.map((item) => ({
    text: item.text,
    value: item.value,
    subtext: item.subtext,
    keepOpen: item.keepOpen,
    leftIcon: item.leftIcon,
    rightIcon: item.rightIcon,
    ariaLabel: item.ariaLabel,
    subitems: item.subitems?.map((sub) => ({
      text: sub.text,
      value: sub.value
    }))
  }))

  const dropdownButtonId = `${dropdownId}-button`
  const triggerAriaLabel = ariaLabel || longLabel || undefined
  const triggerButtonProps = {
    id: dropdownButtonId,
    disabled,
    role: 'combobox' as const,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': showMenu,
    'aria-activedescendant':
      focusedSubIndex !== -1 && openSubmenuIndex !== null
        ? `${dropdownId}-subitem-${openSubmenuIndex}-${focusedSubIndex}`
        : focusedIndex >= 0
          ? `${dropdownId}-item-${focusedIndex}`
          : undefined,
    'aria-controls': `${dropdownId}-listbox`,
    onClick: handleButtonClick,
    onKeyDown: handleKeyDown
  }

  return (
    <div className={mergeClasses('relative w-full min-w-0', className)}>
      {label && (
        <Label htmlFor={dropdownButtonId} disabled={disabled}>
          {label}
        </Label>
      )}
      {isMobile ? (
        <div ref={controlWrapperRef} className="inline-flex">
          <IconBtn ref={buttonRef} size="small" borderless ariaLabel={triggerAriaLabel} {...triggerButtonProps}>
            {mobileIcon || 'tune'}
          </IconBtn>
        </div>
      ) : (
        <InputWrapper disabled={disabled} size={size} inputRef={buttonRef} wrapperRef={controlWrapperRef}>
          <button
            ref={buttonRef}
            type="button"
            aria-label={triggerAriaLabel}
            className={mergeClasses(
              'text-foreground relative w-full cursor-pointer text-left',
              'flex h-full items-center justify-between border-none bg-transparent ps-1 outline-none',
              'disabled:text-disabled disabled:cursor-not-allowed',
              size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : ''
            )}
            {...triggerButtonProps}
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-start" title={longLabel.trim() || undefined}>
              {selectedItem?.leftIcon && <span className="shrink-0">{selectedItem.leftIcon}</span>}
              <span className="min-w-0 flex-1">
                <DropdownItemLabel text={selectedText} subtext={selectedSubtext || undefined} />
              </span>
            </span>
            <span className="pointer-events-none ms-3 flex flex-shrink-0 items-center">
              {rightIcon || <span className="material-symbols text-2xl">expand_more</span>}
            </span>
          </button>
        </InputWrapper>
      )}

      <DropdownMenu
        showMenu={showMenu}
        items={dropdownMenuItems}
        focusedIndex={focusedIndex}
        focusedSubIndex={focusedSubIndex}
        openSubmenuIndex={openSubmenuIndex}
        dropdownId={dropdownId}
        onItemClick={(item) => {
          if (item.subitems && item.subitems.length > 0) {
            // Don't close, toggle submenu
            const idx = dropdownMenuItems.findIndex((i) => i.value === item.value)
            if (idx >= 0) {
              if (openSubmenuIndex === idx) {
                closeSubMenu()
              } else {
                openSubMenu(idx, itemsToShow)
              }
            }
          } else {
            handleOptionClick(item)
          }
        }}
        onSubitemClick={(subitem) => handleSubitemClick(subitem.value)}
        onOpenSubmenu={(index) => {
          if (openSubmenuIndex !== index) {
            setOpenSubmenuIndex(index)
            setSubmenuFilterText('')
          }
        }}
        onCloseSubmenu={() => {
          setOpenSubmenuIndex(null)
          setSubmenuFilterText('')
        }}
        submenuFilterText={submenuFilterText}
        menuMaxHeight={menuMaxHeight}
        showNoItemsMessage={false}
        ref={menuRef}
        highlightSelected={highlightSelected}
        isItemSelected={(item) => item.value === value}
        usePortal={usePortal}
        triggerRef={controlWrapperRef as React.RefObject<HTMLElement>}
        wrapText={wrapText}
        fitContent={isMobile}
      />
    </div>
  )
}
