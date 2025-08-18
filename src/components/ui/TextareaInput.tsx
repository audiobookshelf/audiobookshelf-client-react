'use client'

import { useCallback, useId, useRef } from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import Label from './Label'
import InputWrapper from './InputWrapper'

export interface TextareaInputProps {
  id?: string
  label?: string
  value?: string | number
  placeholder?: string
  readOnly?: boolean
  rows?: number
  disabled?: boolean
  onChange?: (value: string) => void
  className?: string
}

/**
 * Accessible textarea input with optional transparent style and disabled/focus states
 * aligned with InputDropdown visual treatment.
 */
export default function TextareaInput({
  id,
  label,
  value,
  placeholder,
  readOnly = false,
  rows = 2,
  disabled = false,
  onChange,
  className
}: TextareaInputProps) {
  const generatedId = useId()
  const textareaInputId = id || generatedId
  const textareaId = `${textareaInputId}-textarea`
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="w-full" cy-id="textarea-input">
      {label && (
        <Label htmlFor={textareaId} disabled={disabled}>
          {label}
        </Label>
      )}
      <InputWrapper disabled={disabled} readOnly={readOnly} inputRef={textareaRef} size="auto" className="px-1 py-1">
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value?.toString() ?? ''}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          rows={rows}
          dir="auto"
          className={mergeClasses(
            'w-full resize-y bg-transparent py-1 px-1 outline-none border-none',
            'disabled:cursor-not-allowed disabled:text-disabled read-only:text-read-only'
          )}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-multiline="true"
          onChange={handleChange}
          cy-id="textarea-input-textarea"
        />
      </InputWrapper>
    </div>
  )
}
