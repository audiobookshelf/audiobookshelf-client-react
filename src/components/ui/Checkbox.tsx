'use client'

import { mergeClasses } from '@/lib/merge-classes'
import React, { useId, useRef } from 'react'
import InputWrapper from './InputWrapper'

interface CheckboxProps {
  value?: boolean
  label?: string
  size?: 'small' | 'medium' | 'large'
  checkboxBgClass?: string
  borderColorClass?: string
  checkColorClass?: string
  labelClass?: string
  disabled?: boolean
  partial?: boolean
  ariaLabel?: string
  onChange?: (value: boolean) => void
  className?: string
  autoFocus?: boolean
}

export default function Checkbox({
  value = false,
  label,
  size = 'medium',
  checkboxBgClass = 'bg-bg',
  borderColorClass = 'border-gray-400',
  checkColorClass = 'text-green-500',
  labelClass = '',
  disabled = false,
  partial = false,
  ariaLabel = '',
  onChange,
  className = '',
  autoFocus = false
}: CheckboxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const checkboxId = useId()

  const sizeClass = size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-6 h-6'
  const checkboxWrapperClassName = mergeClasses(
    'rounded-sm flex shrink-0 justify-center items-center border',
    checkboxBgClass,
    disabled ? 'border-checkbox-bg-disabled' : borderColorClass,
    sizeClass
  )

  const labelSizeClass = size === 'small' ? 'text-xs md:text-sm ps-1' : size === 'medium' ? 'text-sm md:text-base ps-2' : 'text-base md:text-lg ps-2'
  const checkboxLabelClassName = mergeClasses(labelSizeClass, disabled ? 'cursor-not-allowed text-disabled' : 'cursor-pointer text-foreground', labelClass)

  const svgSizeClass = size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const svgClass = mergeClasses('pointer-events-none', disabled ? 'fill-checkbox-disabled' : 'fill-current', checkColorClass, svgSizeClass)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange?.(e.target.checked)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!disabled) {
        inputRef.current?.click()
      }
    }
  }

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    e.preventDefault()
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleWrapperClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }

  return (
    <InputWrapper disabled={disabled} borderless size={size} className={mergeClasses('bg-transparent', className)} inputRef={inputRef}>
      <div
        cy-id="checkbox-and-label-wrapper"
        ref={wrapperRef}
        className="flex justify-start items-center px-1 py-1"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleWrapperClick}
      >
        <div cy-id="checkbox-wrapper" className={checkboxWrapperClassName}>
          <input
            ref={inputRef}
            id={checkboxId}
            type="checkbox"
            checked={value}
            disabled={disabled}
            aria-label={ariaLabel}
            onMouseDown={(e) => e.preventDefault()}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            autoFocus={autoFocus}
            className="opacity-0 absolute cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none"
          />
          <div
            cy-id="checkbox-div"
            className={mergeClasses('rounded-sm w-full h-full flex justify-center items-center', disabled ? 'bg-checkbox-bg-disabled' : '')}
          >
            {partial ? (
              <span className="material-symbols text-base leading-none text-gray-400">remove</span>
            ) : value ? (
              <svg className={svgClass} viewBox="0 0 20 20">
                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
              </svg>
            ) : null}
          </div>
        </div>
        {label && (
          <label
            cy-id="checkbox-label"
            className={checkboxLabelClassName}
            htmlFor={checkboxId}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLabelClick}
          >
            {label}
          </label>
        )}
      </div>
    </InputWrapper>
  )
}
