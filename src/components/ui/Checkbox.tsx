'use client'

import React, { useMemo, useCallback, useRef, useId } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
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
  className = ''
}: CheckboxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const checkboxId = useId()

  const checkboxWrapperClassName = useMemo(() => {
    const classes = [checkboxBgClass, disabled ? 'border-checkbox-bg-disabled' : borderColorClass]

    if (size === 'small') {
      classes.push('w-4 h-4')
    } else if (size === 'medium') {
      classes.push('w-5 h-5')
    } else {
      // large
      classes.push('w-6 h-6')
    }

    return mergeClasses('rounded-sm flex shrink-0 justify-center items-center border', classes)
  }, [checkboxBgClass, borderColorClass, size, disabled])

  const checkboxLabelClassName = useMemo(() => {
    const classes = []
    if (size === 'small') {
      classes.push('text-xs md:text-sm pl-1')
    } else if (size === 'medium') {
      classes.push('text-sm md:text-base pl-2')
    } else {
      classes.push('text-base md:text-lg pl-2')
    }

    return mergeClasses(classes, disabled ? 'cursor-not-allowed text-disabled' : 'cursor-pointer text-gray-100', labelClass)
  }, [labelClass, size, disabled])

  const svgClass = useMemo(() => {
    const classes = [checkColorClass]

    if (size === 'small') {
      classes.push('w-3 h-3')
    } else if (size === 'medium') {
      classes.push('w-3.5 h-3.5')
    } else {
      // large
      classes.push('w-4 h-4')
    }

    return mergeClasses('pointer-events-none', disabled ? 'fill-checkbox-disabled' : 'fill-current', classes)
  }, [checkColorClass, size, disabled])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange?.(e.target.checked)
      }
    },
    [onChange, disabled]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (!disabled) {
          inputRef.current?.click()
        }
      }
    },
    [disabled]
  )

  const handleLabelClick = useCallback(
    (e: React.MouseEvent<HTMLLabelElement>) => {
      e.preventDefault()
      if (!disabled) {
        inputRef.current?.click()
      }
    },
    [disabled]
  )

  const handleWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus()
      }
    },
    [disabled]
  )

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
