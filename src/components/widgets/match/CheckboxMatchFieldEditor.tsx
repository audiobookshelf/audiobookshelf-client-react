'use client'

import Checkbox from '@/components/ui/Checkbox'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { TranslationKey } from '@/types/translations'
import { memo } from 'react'
import { BaseMatchFieldEditor } from './BaseMatchFieldEditor'

interface CheckboxMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (checked: boolean) => void
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label: string
  currentValue?: boolean | null
  checkboxBgClass?: string
  borderColorClass?: string
  labelClass?: string
  checkedLabelKey?: TranslationKey
  uncheckedLabelKey?: TranslationKey
}

function CheckboxMatchFieldEditor({
  usageChecked,
  onUsageChange,
  value,
  onChange,
  disabled,
  label,
  currentValue,
  checkboxBgClass,
  borderColorClass,
  labelClass,
  checkedLabelKey = 'LabelExplicitChecked' as TranslationKey,
  uncheckedLabelKey = 'LabelExplicitUnchecked' as TranslationKey
}: CheckboxMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const hasCurrentValue = currentValue !== undefined && currentValue !== null

  const formattedValue = hasCurrentValue ? (currentValue ? t(checkedLabelKey) : t(uncheckedLabelKey)) : ''

  const currentValueDisplay = hasCurrentValue ? (
    <>
      {t('LabelCurrently')} {formattedValue}
    </>
  ) : null

  return (
    <BaseMatchFieldEditor
      usageChecked={usageChecked}
      onUsageChange={onUsageChange}
      currentValueDisplay={currentValueDisplay}
      hasCurrentValue={hasCurrentValue}
      isCheckboxField
    >
      <Checkbox
        value={value}
        onChange={onChange}
        disabled={disabled || !usageChecked}
        label={label}
        checkboxBgClass={!usageChecked ? 'bg-bg' : checkboxBgClass || 'bg-primary'}
        borderColorClass={borderColorClass || 'border-border'}
        labelClass={labelClass || 'ps-2 text-base font-semibold'}
      />
    </BaseMatchFieldEditor>
  )
}

export default memo(CheckboxMatchFieldEditor)
