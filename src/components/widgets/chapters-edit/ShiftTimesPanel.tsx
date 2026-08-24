'use client'

import Btn from '@/components/ui/Btn'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import Label from '@/components/ui/Label'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useEffect, useId, useRef, useState } from 'react'

interface ShiftTimesFieldsProps {
  shiftAmount: number
  onShiftAmountChange: (value: number) => void
  onApplyShift: () => void
  applyDisabled?: boolean
  showHelp?: boolean
}

/** Allow optional leading minus and digits while typing (e.g. "-" before "-30"). */
function isValidShiftInput(value: string): boolean {
  return value === '' || value === '-' || /^-?\d+$/.test(value)
}

export function ShiftTimesFields({ shiftAmount, onShiftAmountChange, onApplyShift, applyDisabled = false, showHelp = false }: ShiftTimesFieldsProps) {
  const t = useTypeSafeTranslations()
  const fieldId = useId()
  const inputId = `${fieldId}-input`
  const [inputValue, setInputValue] = useState(() => String(shiftAmount))
  const isFocusedRef = useRef(false)
  const minusPrefixRef = useRef(false)

  useEffect(() => {
    if (!isFocusedRef.current) {
      setInputValue(String(shiftAmount))
      minusPrefixRef.current = false
    }
  }, [shiftAmount])

  const commitInputValue = (value: string) => {
    if (!isValidShiftInput(value)) {
      return
    }

    setInputValue(value)

    if (value === '' || value === '-') {
      onShiftAmountChange(0)
      return
    }

    onShiftAmountChange(Number(value))
  }

  const handleChange = (value: string) => {
    if (minusPrefixRef.current && value !== '' && value !== '-') {
      minusPrefixRef.current = false
      commitInputValue(value.startsWith('-') ? value : `-${value}`)
      return
    }

    minusPrefixRef.current = false
    commitInputValue(value)
  }

  const handleBlur = () => {
    isFocusedRef.current = false
    minusPrefixRef.current = false
    if (inputValue === '' || inputValue === '-') {
      setInputValue('0')
      onShiftAmountChange(0)
    }
  }

  return (
    <div className="w-fit shrink-0">
      <div className="mb-1 flex items-center gap-1">
        <Label htmlFor={inputId} className="mb-0">
          {showHelp ? t('LabelTimeToShiftShort') : t('LabelTimeToShift')}
        </Label>
        {showHelp ? <HelpTooltipIcon text={t('NoteChapterEditorTimes')} size="sm" /> : null}
      </div>
      <div className="flex items-center gap-2">
        <TextInput
          id={fieldId}
          type="number"
          step={1}
          value={inputValue === '-' ? '' : inputValue}
          size="small"
          className="w-fit"
          wrapperClassName="w-14"
          customInputClass="no-spinner"
          onChange={handleChange}
          onFocus={() => {
            isFocusedRef.current = true
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !applyDisabled) {
              onApplyShift()
              return
            }
            if (e.key === '-' && !e.currentTarget.value.includes('-')) {
              minusPrefixRef.current = true
              setInputValue('')
              onShiftAmountChange(0)
            }
          }}
        />
        <Btn color="bg-primary" size="small" disabled={applyDisabled} onClick={onApplyShift}>
          {t('ButtonAdd')}
        </Btn>
      </div>
    </div>
  )
}
