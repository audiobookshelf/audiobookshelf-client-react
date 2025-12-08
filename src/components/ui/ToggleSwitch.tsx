'use client'

import { mergeClasses } from '@/lib/merge-classes'
import React, { useId, useRef } from 'react'
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

  const colorMap: Record<string, string> = {
    success: 'bg-success',
    primary: 'bg-primary',
    warning: 'bg-warning',
    error: 'bg-error'
  }
  const bgColorClasses = colorMap[value ? onColor : offColor] || 'bg-primary'

  const widthClasses = size === 'small' ? 'w-6' : size === 'medium' ? 'w-8' : 'w-10'
  const buttonClassName = mergeClasses(
    'border rounded-full border-border flex items-center cursor-pointer justify-start outline-none',
    bgColorClasses,
    disabled ? 'cursor-not-allowed bg-checkbox-bg-disabled border-checkbox-bg-disabled' : '',
    widthClasses
  )

  const sizeClasses = size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : 'w-5 h-5'
  const translateClass = size === 'small' ? 'translate-x-3' : size === 'medium' ? 'translate-x-4' : 'translate-x-5'
  const switchClassName = mergeClasses(
    'rounded-full border border-black-50 shadow-sm transform transition-transform duration-100',
    disabled ? 'bg-disabled' : 'bg-white',
    value ? translateClass : '',
    sizeClasses
  )

  const labelSizeClass = size === 'small' ? 'text-xs md:text-sm' : size === 'medium' ? 'text-sm md:text-base' : 'text-base md:text-lg'
  const labelClassName = mergeClasses('ps-2', labelSizeClass, disabled ? 'cursor-not-allowed text-disabled' : 'cursor-pointer text-foreground')

  const triggerChange = () => {
    if (!disabled) {
      onChange?.(!value)
    }
  }

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    triggerChange()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerChange()
    }
  }

  const handleWrapperClick = () => {
    if (buttonRef.current && !disabled) {
      buttonRef.current.focus()
    }
  }

  const derivedAriaLabel = label ? undefined : ariaLabel
  const derivedAriaLabelledBy = label ? labelId : ariaLabelledBy

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
