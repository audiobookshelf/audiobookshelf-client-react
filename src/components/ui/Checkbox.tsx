'use client'

import React, { useMemo, useCallback, useRef } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

interface CheckboxProps {
  value?: boolean
  label?: string
  small?: boolean
  medium?: boolean
  checkboxBg?: string
  borderColor?: string
  checkColor?: string
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
  small = false,
  medium = false,
  checkboxBg = 'bg',
  borderColor = 'gray-400',
  checkColor = 'green-500',
  labelClass = '',
  disabled = false,
  partial = false,
  ariaLabel = '',
  onChange,
  className = ''
}: CheckboxProps) {
  const labelRef = useRef<HTMLLabelElement>(null)

  const checkboxWrapperClassName = useMemo(() => {
    const classes = [`bg-${checkboxBg}`, `border-${borderColor}`]

    if (small) {
      classes.push('w-4 h-4')
    } else if (medium) {
      classes.push('w-5 h-5')
    } else {
      classes.push('w-6 h-6')
    }

    return mergeClasses('border-2 rounded-sm flex shrink-0 justify-center items-center', classes)
  }, [checkboxBg, borderColor, small, medium])

  const checkboxLabelClassName = useMemo(() => {
    if (labelClass) return labelClass

    const classes = []
    if (small) {
      classes.push('text-xs md:text-sm pl-1')
    } else if (medium) {
      classes.push('text-base md:text-lg pl-2')
    } else {
      classes.push('pl-2')
    }

    return mergeClasses('select-none', classes, disabled ? 'text-gray-400' : 'text-gray-100')
  }, [labelClass, small, medium, disabled])

  const svgClass = useMemo(() => {
    const classes = [`text-${checkColor}`]

    if (small) {
      classes.push('w-3 h-3')
    } else if (medium) {
      classes.push('w-3.5 h-3.5')
    } else {
      classes.push('w-4 h-4')
    }

    return mergeClasses('fill-current pointer-events-none', classes)
  }, [checkColor, small, medium])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange && !disabled) {
        onChange(e.target.checked)
      }
    },
    [onChange, disabled]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLabelElement>) => {
      if (e.key === 'Enter' && document.activeElement === labelRef.current) {
        e.preventDefault()
        if (onChange && !disabled) {
          onChange(!value)
        }
      }
    },
    [onChange, disabled, value]
  )

  const labelElementClassName = useMemo(() => {
    return mergeClasses('flex justify-start items-center', !disabled ? 'cursor-pointer' : '', className)
  }, [disabled, className])

  return (
    <label ref={labelRef} tabIndex={0} className={labelElementClassName} onKeyDown={handleKeyDown}>
      <div cy-id="checkbox-wrapper" className={checkboxWrapperClassName}>
        <input
          type="checkbox"
          tabIndex={-1}
          checked={value}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={handleChange}
          className={mergeClasses('opacity-0 absolute', !disabled ? 'cursor-pointer' : '')}
        />
        {partial ? (
          <span className="material-symbols text-base leading-none text-gray-400">remove</span>
        ) : value ? (
          <svg className={svgClass} viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
          </svg>
        ) : null}
      </div>
      {label && (
        <div cy-id="checkbox-label" className={checkboxLabelClassName}>
          {label}
        </div>
      )}
    </label>
  )
}
