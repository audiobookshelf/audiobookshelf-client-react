import React, { useId, useMemo, useCallback } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

interface RangeInputProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  label?: string
  className?: string
  disabled?: boolean
  ref?: React.Ref<HTMLInputElement>
}

const RangeInput = ({ value, min = 0, max = 100, step = 1, onChange, label, className = '', disabled = false, ref }: RangeInputProps) => {
  const uniqueId = useId()
  const inputId = `range-input-${uniqueId}`
  const labelId = label ? `range-label-${uniqueId}` : undefined

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(event.target.value)
      onChange(newValue)
    },
    [onChange]
  )

  const containerClasses = useMemo(() => mergeClasses('flex flex-col items-start gap-2 w-full', className), [className])

  const rangeInputClasses = useMemo(
    () =>
      mergeClasses(
        // Base styles
        'appearance-none bg-transparent cursor-pointer focus:outline-none w-full',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Webkit slider track
        '[&::-webkit-slider-runnable-track]:bg-black/25',
        '[&::-webkit-slider-runnable-track]:rounded-full',
        '[&::-webkit-slider-runnable-track]:h-3',

        // Webkit slider thumb
        '[&::-webkit-slider-thumb]:appearance-none',
        '[&::-webkit-slider-thumb]:-mt-1',
        '[&::-webkit-slider-thumb]:rounded-full',
        '[&::-webkit-slider-thumb]:bg-white/70',
        '[&::-webkit-slider-thumb]:h-5',
        '[&::-webkit-slider-thumb]:w-5',

        // Mozilla range track
        '[&::-moz-range-track]:bg-black/25',
        '[&::-moz-range-track]:rounded-full',
        '[&::-moz-range-track]:h-3',

        // Mozilla range thumb
        '[&::-moz-range-thumb]:border-none',
        '[&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:-mt-1',
        '[&::-moz-range-thumb]:bg-white/70',
        '[&::-moz-range-thumb]:h-5',
        '[&::-moz-range-thumb]:w-5'
      ),
    []
  )

  return (
    <div className={containerClasses}>
      {label && (
        <label id={labelId} htmlFor={inputId} className={`px-1 text-sm font-semibold ${disabled ? 'text-gray-400' : ''}`}>
          {label}
        </label>
      )}
      <div
        className={mergeClasses(
          'inline-flex items-center w-full rounded-sm px-2 py-1 focus-within:outline',
          disabled ? 'bg-black-300 text-gray-400 cursor-not-allowed' : 'bg-primary cursor-text'
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-disabled={disabled}
          aria-labelledby={labelId}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value}%`}
          className={rangeInputClasses}
        />
        <span className="text-sm ml-2" aria-hidden="true">
          {value}%
        </span>
      </div>
    </div>
  )
}

export default RangeInput
