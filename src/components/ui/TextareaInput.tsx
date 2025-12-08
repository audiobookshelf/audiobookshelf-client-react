'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { useId, useRef } from 'react'
import InputWrapper from './InputWrapper'
import Label from './Label'

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
  fillHeight?: boolean
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
  rows,
  disabled = false,
  onChange,
  className,
  fillHeight = false
}: TextareaInputProps) {
  const generatedId = useId()
  const textareaInputId = id || generatedId
  const textareaId = `${textareaInputId}-textarea`
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  const textareaClass = mergeClasses('w-full', fillHeight && (label ? 'h-full grid grid-rows-[auto_1fr]' : 'h-full flex flex-col'), className)
  const inputWrapperClass = mergeClasses('px-1 py-1', fillHeight && 'h-full flex flex-col min-h-0')
  const textareaClassNames = mergeClasses(
    'w-full bg-transparent py-1 px-1 outline-none border-none',
    fillHeight ? 'h-full resize-none' : 'resize-y',
    'disabled:cursor-not-allowed disabled:text-disabled read-only:text-read-only'
  )

  return (
    <div className={textareaClass} cy-id="textarea-input">
      {label && (
        <Label htmlFor={textareaId} disabled={disabled}>
          {label}
        </Label>
      )}
      <InputWrapper disabled={disabled} readOnly={readOnly} inputRef={textareaRef} size="auto" className={inputWrapperClass}>
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value?.toString() ?? ''}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          rows={fillHeight ? undefined : rows}
          dir="auto"
          className={textareaClassNames}
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
