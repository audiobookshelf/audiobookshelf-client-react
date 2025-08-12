'use client'

import { useCallback, useId, useMemo, useState } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { copyToClipboard } from '@/lib/clipboard'
import Label from './Label'

export interface TextInputProps {
  id?: string
  name?: string
  label?: string
  value?: string | number
  placeholder?: string
  readOnly?: boolean
  type?: string
  disabled?: boolean
  clearable?: boolean
  showCopy?: boolean
  step?: string | number
  min?: string | number
  customInputClass?: string
  onChange?: (value: string) => void
  onClear?: () => void
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  ref?: React.Ref<HTMLInputElement>
}

export default function TextInput({
  id,
  name,
  label,
  value,
  placeholder,
  readOnly = false,
  type = 'text',
  disabled = false,
  clearable = false,
  showCopy = false,
  step,
  min,
  customInputClass,
  onChange,
  onClear,
  onFocus,
  onBlur,
  className,
  ref
}: TextInputProps) {
  const generatedId = useId()
  const textInputId = id || generatedId
  const inputId = `${textInputId}-input`

  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [hasCopied, setHasCopied] = useState<boolean | null>(null)
  const [isInvalidDate, setIsInvalidDate] = useState(false)

  const actualType = useMemo(() => {
    if (type === 'password' && showPassword) return 'text'
    return type
  }, [type, showPassword])

  const wrapperClass = useMemo(() => {
    return mergeClasses(
      'relative w-full shadow-xs flex items-stretch rounded-sm px-2 py-2 focus-within:outline',
      isInvalidDate ? 'border border-error focus-within:outline-error' : 'border border-gray-600 focus-within:outline',
      disabled ? 'bg-bg-disabled' : readOnly ? 'bg-bg-read-only' : 'bg-primary',
      className
    )
  }, [disabled, readOnly, isInvalidDate, className])

  // Derive aria-label from label or placeholder
  const ariaLabel = useMemo(() => {
    if (label) return label
    if (placeholder) return placeholder
    return undefined
  }, [label, placeholder])

  // Derive aria-invalid from isInvalidDate state
  const ariaInvalid = useMemo(() => isInvalidDate, [isInvalidDate])

  const inputClass = useMemo(() => {
    const classes: string[] = []

    if (showCopy) {
      classes.push('pl-1', 'pr-8')
    } else {
      classes.push('px-1')
    }

    if (customInputClass) classes.push(customInputClass)

    return mergeClasses(
      'w-full bg-transparent px-1 outline-none border-none h-full',
      'disabled:cursor-not-allowed disabled:text-disabled read-only:text-read-only',
      '[&::-webkit-calendar-picker-indicator]:invert',
      classes
    )
  }, [customInputClass, showCopy])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange?.('')
    onClear?.()
  }, [onChange, onClear])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onFocus?.()
  }, [onFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    onBlur?.()
  }, [onBlur])

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (type === 'datetime-local') {
        if (e.currentTarget.validity?.badInput) {
          setIsInvalidDate(true)
        } else {
          setIsInvalidDate(false)
        }
      }
    },
    [type]
  )

  const handleCopyToClipboard = useCallback(async () => {
    if (hasCopied) return

    const textToCopy = value?.toString() ?? ''

    try {
      await copyToClipboard(textToCopy)
      setHasCopied(true)
      setTimeout(() => {
        setHasCopied(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [value, hasCopied])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  // Show password toggle when focused or when password field has value
  const shouldShowPasswordToggle = useMemo(() => {
    return type === 'password' && (isFocused || value)
  }, [type, isFocused, value])

  return (
    <div className="w-full" cy-id="text-input">
      {label && (
        <Label htmlFor={inputId} disabled={disabled}>
          {label}
        </Label>
      )}

      <div className={wrapperClass} cy-id="text-input-wrapper">
        <input
          ref={ref}
          id={inputId}
          name={name}
          value={value?.toString() ?? ''}
          type={actualType}
          step={step?.toString()}
          min={min?.toString()}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={placeholder}
          dir="auto"
          className={inputClass}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // Accessibility attributes
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          cy-id="text-input-field"
        />

        {clearable && value && (
          <div className="absolute top-0 right-0 h-full px-2 flex items-center justify-center">
            <button
              type="button"
              className="material-symbols text-gray-300 cursor-pointer hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 rounded"
              style={{ fontSize: '1.1rem' }}
              onClick={handleClear}
              aria-label="Clear input"
              cy-id="text-input-clear"
            >
              close
            </button>
          </div>
        )}

        {shouldShowPasswordToggle && (
          <div className="absolute top-0 right-0 h-full px-4 flex items-center justify-center">
            <button
              type="button"
              className="material-symbols text-gray-400 cursor-pointer text-lg hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 rounded"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              cy-id="text-input-password-toggle"
            >
              {!showPassword ? 'visibility' : 'visibility_off'}
            </button>
          </div>
        )}

        {showCopy && type !== 'password' && (
          <div className="absolute top-0 right-0 h-full px-2 flex items-center justify-center">
            <button
              type="button"
              className={mergeClasses(
                'material-symbols cursor-pointer text-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 rounded',
                hasCopied ? 'text-success' : 'text-gray-400 hover:text-white'
              )}
              onClick={handleCopyToClipboard}
              aria-label={hasCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
              cy-id="text-input-copy"
            >
              {!hasCopied ? 'content_copy' : 'done'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
