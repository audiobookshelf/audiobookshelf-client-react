'use client'

import React, { useMemo, useCallback, useRef, useId } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import InputWrapper from './InputWrapper'

interface ToggleSwitchProps {
  value?: boolean
  size?: 'small' | 'medium' | 'large'
  onColor?: 'success' | 'primary' | 'warning' | 'error'
  offColor?: 'success' | 'primary' | 'warning' | 'error'
  disabled?: boolean
  onChange?: (value: boolean) => void
  label?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  className?: string
}

export default function ToggleSwitch({
  value = false,
  label,
  size = 'medium',
  onColor = 'success',
  offColor = 'primary',
  disabled = false,
  onChange,
  ariaLabel = '',
  ariaLabelledBy = '',
  className = ''
}: ToggleSwitchProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const id = useId()
  const toggleId = `${id}-toggle`
  const labelId = `${id}-label`

  const bgColorClasses = useMemo(() => {
    const colorMap = {
      success: 'bg-success',
      primary: 'bg-primary',
      warning: 'bg-warning',
      error: 'bg-error'
    }
    return colorMap[value ? onColor : offColor] || 'bg-primary'
  }, [value, onColor, offColor])

  const buttonClassName = useMemo(() => {
    const baseClasses = 'border rounded-full border-border flex items-center cursor-pointer justify-start outline-none'
    const disabledClasses = disabled ? 'cursor-not-allowed bg-checkbox-bg-disabled border-checkbox-bg-disabled' : ''
    const widthClasses = size === 'small' ? 'w-6' : size === 'medium' ? 'w-8' : 'w-10'

    return mergeClasses(baseClasses, bgColorClasses, disabledClasses, widthClasses)
  }, [disabled, size, bgColorClasses])

  const switchClassName = useMemo(() => {
    const baseClasses = 'rounded-full border border-black-50 shadow-sm transform transition-transform duration-100'
    const bgColor = disabled ? 'bg-disabled' : 'bg-white'
    const sizeClasses = size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : 'w-5 h-5'
    const translateClass = size === 'small' ? 'translate-x-3' : size === 'medium' ? 'translate-x-4' : 'translate-x-5'
    const transformClass = value ? translateClass : ''

    return mergeClasses(baseClasses, bgColor, transformClass, sizeClasses)
  }, [value, disabled, size])

  const labelClassName = useMemo(() => {
    const classes = []
    classes.push('ps-2')
    if (size === 'small') {
      classes.push('text-xs md:text-sm')
    } else if (size === 'medium') {
      classes.push('text-sm md:text-base')
    } else {
      classes.push('text-base md:text-lg')
    }

    return mergeClasses(classes, disabled ? 'cursor-not-allowed text-disabled' : 'cursor-pointer text-gray-100')
  }, [size, disabled])

  const triggerChange = useCallback(() => {
    if (!disabled) {
      onChange?.(!value)
    }
  }, [onChange, value, disabled])

  const handleToggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      triggerChange()
    },
    [triggerChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        triggerChange()
      }
    },
    [triggerChange]
  )

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (buttonRef.current && !disabled) {
        buttonRef.current.focus()
      }
    },
    [disabled]
  )

  const derivedAriaLabel = useMemo(() => {
    if (label) return undefined // aria-labelledby will be used instead
    return ariaLabel
  }, [label, ariaLabel])

  const derivedAriaLabelledBy = useMemo(() => {
    if (label) return labelId
    return ariaLabelledBy
  }, [label, labelId, ariaLabelledBy])

  return (
    <InputWrapper disabled={disabled} borderless size={size} className={mergeClasses('bg-transparent', className)}>
      <div
        cy-id="toggle-and-label-wrapper"
        ref={wrapperRef}
        className="flex justify-start items-center px-1 py-1"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleWrapperClick}
      >
        <button
          ref={buttonRef}
          id={toggleId}
          type="button"
          role="checkbox"
          aria-checked={value}
          aria-label={derivedAriaLabel}
          aria-labelledby={derivedAriaLabelledBy}
          disabled={disabled}
          className={buttonClassName}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <span cy-id="toggle-switch" className={switchClassName} />
        </button>
        {label && (
          <label cy-id="toggle-label" id={labelId} className={labelClassName} htmlFor={toggleId} onMouseDown={(e) => e.preventDefault()}>
            {label}
          </label>
        )}
      </div>
    </InputWrapper>
  )
}
