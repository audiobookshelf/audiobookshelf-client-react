'use client'

import { useMergedRef } from '@/hooks/useMergedRef'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { copyToClipboard } from '@/lib/clipboard'
import { mergeClasses } from '@/lib/merge-classes'
import { useId, useState } from 'react'
import InputWrapper from './InputWrapper'
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
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
  onChange?: (value: string) => void
  onClear?: () => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
  ref?: React.Ref<HTMLInputElement>
  error?: string
  autocomplete?: 'off' | 'username' | 'current-password' | 'new-password' | 'email' | 'tel' | string
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
  enterKeyHint,
  onChange,
  onClear,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  ref,
  error,
  autocomplete = 'off'
}: TextInputProps) {
  const t = useTypeSafeTranslations()
  const generatedId = useId()
  const textInputId = id || generatedId
  const inputId = `${textInputId}-input`

  const [readInputRef, writeInputRef] = useMergedRef<HTMLInputElement>(ref)

  const [showPassword, setShowPassword] = useState(false)
  const [hasCopied, setHasCopied] = useState<boolean | null>(null)
  const [isInvalidDate, setIsInvalidDate] = useState(false)

  const actualType = type === 'password' && showPassword ? 'text' : type
  const ariaLabel = label || placeholder || undefined
  const ariaInvalid = isInvalidDate

  const inputClass = mergeClasses(
    'w-full bg-transparent px-1 outline-none border-none h-full',
    'disabled:cursor-not-allowed disabled:text-disabled read-only:text-read-only',
    '[&::-webkit-calendar-picker-indicator]:invert',
    showCopy ? 'ps-1 pe-8' : 'px-1',
    customInputClass
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const handleClear = () => {
    onChange?.('')
    onClear?.()
  }

  const handleFocus = () => {
    onFocus?.()
  }

  const handleBlur = () => {
    onBlur?.()
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === 'datetime-local') {
      if (e.currentTarget.validity?.badInput) {
        setIsInvalidDate(true)
      } else {
        setIsInvalidDate(false)
      }
    }
  }

  const handleCopyToClipboard = async () => {
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
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  // Show password toggle when it is a password field
  const shouldShowPasswordToggle = type === 'password'

  return (
    <div className={mergeClasses('w-full', className)} cy-id="text-input">
      {label && (
        <Label htmlFor={inputId} disabled={disabled}>
          {label}
        </Label>
      )}

      <InputWrapper disabled={disabled} readOnly={readOnly} error={error || isInvalidDate} inputRef={readInputRef}>
        <input
          ref={writeInputRef}
          id={inputId}
          name={name}
          value={value?.toString() ?? ''}
          autoComplete={autocomplete}
          type={actualType}
          step={step?.toString()}
          min={min?.toString()}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={placeholder}
          dir="auto"
          className={inputClass}
          enterKeyHint={enterKeyHint}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // Accessibility attributes
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          cy-id="text-input-field"
        />

        {clearable && value && (
          <div className="absolute top-0 end-0 h-full px-2 flex items-center justify-center">
            <button
              type="button"
              className="material-symbols text-foreground-muted cursor-pointer hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground-muted focus:ring-offset-1 rounded"
              style={{ fontSize: '1.1rem' }}
              onClick={handleClear}
              aria-label={t('ButtonClearInput')}
              cy-id="text-input-clear"
            >
              close
            </button>
          </div>
        )}

        {shouldShowPasswordToggle && (
          <div className="absolute top-0 end-0 h-full px-4 flex items-center justify-center">
            <button
              type="button"
              className="material-symbols text-foreground-muted cursor-pointer text-lg hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground-muted focus:ring-offset-1 rounded"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? t('ButtonHidePassword') : t('ButtonShowPassword')}
              aria-controls={inputId}
              cy-id="text-input-password-toggle"
            >
              {!showPassword ? (
                <span className="material-symbols" aria-hidden="true">
                  visibility
                </span>
              ) : (
                <span className="material-symbols" aria-hidden="true">
                  visibility_off
                </span>
              )}
            </button>
          </div>
        )}

        {showCopy && type !== 'password' && (
          <div className="absolute top-0 end-0 h-full px-2 flex items-center justify-center">
            <button
              type="button"
              className={mergeClasses(
                'material-symbols cursor-pointer text-lg focus:outline-none focus:ring-2 focus:ring-foreground-muted focus:ring-offset-1 rounded',
                hasCopied ? 'text-success' : 'text-foreground-muted hover:text-foreground'
              )}
              onClick={handleCopyToClipboard}
              aria-label={hasCopied ? t('ButtonCopiedToClipboard') : t('ButtonCopyToClipboard')}
              cy-id="text-input-copy"
            >
              {!hasCopied ? 'content_copy' : 'done'}
            </button>
          </div>
        )}
      </InputWrapper>
    </div>
  )
}
