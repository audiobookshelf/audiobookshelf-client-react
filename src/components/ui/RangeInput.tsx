'use client'

import { useMergedRef } from '@/hooks/useMergedRef'
import { mergeClasses } from '@/lib/merge-classes'
import React, { useId } from 'react'
import InputWrapper from './InputWrapper'
import Label from './Label'

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
  const rangeInputId = useId()
  const inputId = `${rangeInputId}-input`
  const [readInputRef, writeInputRef] = useMergedRef<HTMLInputElement>(ref)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value)
    onChange(newValue)
  }

  const containerClasses = mergeClasses('flex flex-col items-start w-full', className)

  const rangeInputClasses = mergeClasses(
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
  )

  return (
    <div className={containerClasses}>
      {label && (
        <Label htmlFor={inputId} disabled={disabled}>
          {label}
        </Label>
      )}
      <InputWrapper disabled={disabled} inputRef={readInputRef}>
        <div className="inline-flex items-center w-full">
          <input
            ref={writeInputRef}
            id={inputId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            aria-disabled={disabled}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={`${value}%`}
            className={rangeInputClasses}
          />
          <span className="text-sm ms-2" aria-hidden="true">
            {value}%
          </span>
        </div>
      </InputWrapper>
    </div>
  )
}

export default RangeInput
