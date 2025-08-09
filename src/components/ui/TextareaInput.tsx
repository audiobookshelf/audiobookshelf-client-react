'use client'

import { useCallback, useId, useMemo } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

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
  const textareaId = id || generatedId

  const wrapperClass = useMemo(() => {
    return mergeClasses(
      'relative w-full shadow-xs flex items-stretch rounded-sm px-2 py-2 focus-within:outline',
      'border border-gray-600',
      disabled ? 'bg-black-300 text-gray-400' : readOnly ? 'bg-black-400 text-gray-400' : 'bg-primary',
      className
    )
  }, [disabled, readOnly, className])

  const labelClass = useMemo(() => mergeClasses('px-1 text-sm font-semibold', disabled ? 'text-gray-400' : ''), [disabled])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="w-full" cy-id="textarea-input">
      {label ? (
        <label htmlFor={textareaId} className={labelClass}>
          {label}
        </label>
      ) : null}
      <div className={wrapperClass} cy-id="textarea-input-wrapper">
        <textarea
          id={textareaId}
          value={value?.toString() ?? ''}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          rows={rows}
          dir="auto"
          className={mergeClasses(
            'w-full resize-y bg-transparent px-1 outline-none border-none',
            disabled ? 'cursor-not-allowed' : '',
            disabled || readOnly ? 'text-gray-400' : 'text-gray-200'
          )}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-multiline="true"
          onChange={handleChange}
          cy-id="textarea-input-textarea"
        />
      </div>
    </div>
  )
}
