'use client'

import Btn from '@/components/ui/Btn'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import Label from '@/components/ui/Label'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useId } from 'react'

interface ShiftTimesFieldsProps {
  shiftAmount: number
  onShiftAmountChange: (value: number) => void
  onApplyShift: () => void
  applyDisabled?: boolean
  showHelp?: boolean
}

export function ShiftTimesFields({ shiftAmount, onShiftAmountChange, onApplyShift, applyDisabled = false, showHelp = false }: ShiftTimesFieldsProps) {
  const t = useTypeSafeTranslations()
  const fieldId = useId()
  const inputId = `${fieldId}-input`

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
          value={String(shiftAmount)}
          size="small"
          className="w-fit"
          wrapperClassName="w-20"
          onChange={(value) => onShiftAmountChange(Number(value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !applyDisabled) onApplyShift()
          }}
        />
        <Btn color="bg-primary" size="small" disabled={applyDisabled} onClick={onApplyShift}>
          {t('ButtonAdd')}
        </Btn>
      </div>
    </div>
  )
}
