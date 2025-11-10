'use client'

import ButtonBase from '@/components/ui/ButtonBase'
import Label from '@/components/ui/Label'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

type ToggleItem = {
  text: string
  value: string | number
}

interface ToggleButtonGroupProps {
  items: ToggleItem[]
  value: string | number
  onChange: (value: string | number) => void

  // bubble into InputWrapper for consistent shell
  disabled?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  className?: string

  // labelling
  label?: string
  ariaLabel?: string
  ariaLabelledBy?: string
}

export default function ToggleButtonGroup({
  items,
  value,
  onChange,
  disabled = false,
  size = 'medium',
  className,
  label,
  ariaLabel,
  ariaLabelledBy
}: ToggleButtonGroupProps) {
  const id = useId()
  const toggleGroupId = `${id}-toggle-group`
  const labelId = label ? `${id}-label` : undefined

  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === value)
  )
  const [focusIndex, setFocusIndex] = useState(selectedIndex)

  useEffect(() => {
    setFocusIndex(selectedIndex)
  }, [selectedIndex])

  // Derive aria-label from label or ariaLabel prop
  const derivedAriaLabel = useMemo(() => {
    if (label) return undefined // aria-labelledby will be used instead
    return ariaLabel
  }, [label, ariaLabel])

  const derivedAriaLabelledBy = useMemo(() => {
    if (label) return labelId
    return ariaLabelledBy
  }, [label, labelId, ariaLabelledBy])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return

      const last = items.length - 1
      let next = focusIndex

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          next = focusIndex === last ? 0 : focusIndex + 1
          break
        case 'ArrowLeft':
          e.preventDefault()
          next = focusIndex === 0 ? last : focusIndex - 1
          break
        case 'Home':
          e.preventDefault()
          next = 0
          break
        case 'End':
          e.preventDefault()
          next = last
          break
        default:
          return
      }

      if (next !== focusIndex) {
        setFocusIndex(next)
        btnRefs.current[next]?.focus()
        onChange(items[next].value)
      }
    },
    [disabled, focusIndex, items, onChange]
  )

  const handleRadioButtonClick = useCallback(
    (item: ToggleItem) => {
      if (disabled) return
      onChange(item.value)
    },
    [disabled, onChange]
  )

  const handleRadioButtonKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault()
  }, [])

  const containerClass = useMemo(
    () =>
      mergeClasses(
        'inline-flex w-full sm:w-fit h-full overflow-hidden rounded-md shadow-md focus-within:outline [&>button:not(:first-child)]:border-s-0',
        className
      ),
    [className]
  )

  const buttonClass = useCallback(
    (isSelected: boolean) => {
      return mergeClasses(
        size === 'small' ? 'text-sm px-3 sm:px-4' : size === 'large' ? 'text-base sm:text-lg px-4 sm:px-6' : 'text-base px-3 sm:px-4',
        isSelected ? 'text-foreground bg-button-selected-bg disabled:bg-button-selected-bg/80' : '',
        'rounded-none first:rounded-s-md last:rounded-e-md', // squared inside; wrapper provides outer rounding
        'focus-visible:outline-0' // focus ring is on the container
      )
    },
    [size]
  )

  return (
    <div className="w-full" cy-id="toggle-button-group">
      {label && (
        <Label id={labelId} htmlFor={toggleGroupId} disabled={disabled}>
          {label}
        </Label>
      )}

      <div
        id={toggleGroupId}
        role="radiogroup"
        aria-disabled={disabled || undefined}
        aria-labelledby={derivedAriaLabelledBy}
        aria-label={derivedAriaLabel}
        className={containerClass}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, idx) => {
          const isSelected = item.value === value
          const tabbable = isSelected ? 0 : -1

          return (
            <ButtonBase
              key={item.value}
              ref={(el: HTMLButtonElement | null) => {
                btnRefs.current[idx] = el
              }}
              type="button"
              disabled={disabled}
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabbable}
              aria-pressed={undefined} // avoid conflict with role="radio"
              onClick={() => handleRadioButtonClick(item)}
              onKeyDown={handleRadioButtonKeyDown}
              size={size}
              className={buttonClass(isSelected)}
            >
              {item.text}
            </ButtonBase>
          )
        })}
      </div>
    </div>
  )
}
