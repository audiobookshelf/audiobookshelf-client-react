'use client'

import SlateEditor from '@/components/ui/SlateEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { memo, useCallback } from 'react'
import { BaseMatchFieldEditor } from './BaseMatchFieldEditor'

interface SlateEditorMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (checked: boolean) => void
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
  label: string
  currentValue?: string
}

function SlateEditorMatchFieldEditor({ usageChecked, onUsageChange, value, onChange, disabled, label, currentValue }: SlateEditorMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const handleUseCurrentValue = useCallback(() => {
    if (currentValue !== undefined) {
      onChange(currentValue)
    }
  }, [currentValue, onChange])

  const hasCurrentValue = currentValue !== undefined && currentValue !== ''

  const formattedValue = currentValue ? String(currentValue).substring(0, 100) + (String(currentValue).length > 100 ? '...' : '') : ''

  const currentValueDisplay = hasCurrentValue ? (
    <>
      {t('LabelCurrently')}{' '}
      <a title={t('LabelClickToUseCurrentValue')} className="cursor-pointer hover:underline" onClick={handleUseCurrentValue}>
        {formattedValue}
      </a>
    </>
  ) : null

  return (
    <BaseMatchFieldEditor usageChecked={usageChecked} onUsageChange={onUsageChange} currentValueDisplay={currentValueDisplay} hasCurrentValue={hasCurrentValue}>
      <SlateEditor srcContent={value || ''} onUpdate={onChange} disabled={disabled || !usageChecked} label={label} />
    </BaseMatchFieldEditor>
  )
}

export default memo(SlateEditorMatchFieldEditor)
