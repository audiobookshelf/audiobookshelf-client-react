'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useId, useMemo, useRef } from 'react'
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
}

/**
 * Accessible textarea input with optional transparent style and disabled/focus states
 * aligned with InputDropdown visual treatment.
 */
export default function TextareaInput({ id, label, value, placeholder, readOnly = false, rows, disabled = false, onChange, className }: TextareaInputProps) {
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

  const textareaClass = useMemo(() => {
    return mergeClasses('w-full', rows === undefined && 'flex flex-col flex-1 min-h-0', className)
  }, [className, rows])

  const inputWrapperClass = useMemo(() => {
    return mergeClasses('px-1 py-1', rows === undefined && 'flex-1 min-h-0 flex flex-col')
  }, [rows])

  const textareaClassNames = useMemo(() => {
    return mergeClasses(
      'w-full bg-transparent py-1 px-1 outline-none border-none',
      rows === undefined ? 'h-full resize-none' : 'resize-y',
      'disabled:cursor-not-allowed disabled:text-disabled read-only:text-read-only'
    )
  }, [rows])

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
          rows={rows}
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
