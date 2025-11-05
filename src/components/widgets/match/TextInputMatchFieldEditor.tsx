'use client'

import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { memo, useCallback } from 'react'
import { BaseMatchFieldEditor } from './BaseMatchFieldEditor'

interface TextInputMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (checked: boolean) => void
  value: string | number | undefined
  onChange: (value: string) => void
  disabled?: boolean
  label: string
  currentValue?: string | number
  type?: string
  readOnly?: boolean
  className?: string
}

function TextInputMatchFieldEditor({
  usageChecked,
  onUsageChange,
  value,
  onChange,
  disabled,
  label,
  currentValue,
  type,
  readOnly,
  className
}: TextInputMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const handleUseCurrentValue = useCallback(() => {
    if (currentValue !== undefined) {
      onChange(String(currentValue))
    }
  }, [currentValue, onChange])

  const hasCurrentValue = currentValue !== undefined && currentValue !== ''

  const currentValueDisplay = hasCurrentValue ? (
    <>
      {t('LabelCurrently')}{' '}
      <a title={t('LabelClickToUseCurrentValue')} className="cursor-pointer hover:underline" onClick={handleUseCurrentValue}>
        {String(currentValue)}
      </a>
    </>
  ) : null

  return (
    <BaseMatchFieldEditor
      usageChecked={usageChecked}
      onUsageChange={onUsageChange}
      currentValueDisplay={currentValueDisplay}
      hasCurrentValue={hasCurrentValue}
      className={className}
    >
      <TextInput value={value} onChange={onChange} disabled={disabled || !usageChecked} label={label} type={type} readOnly={readOnly} className={className} />
    </BaseMatchFieldEditor>
  )
}

export default memo(TextInputMatchFieldEditor)
