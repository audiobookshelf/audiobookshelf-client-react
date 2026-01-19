'use client'

import SlateEditor from '@/components/ui/SlateEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { memo, useCallback, useRef, useState } from 'react'
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

  // Local state to manage what we pass to SlateEditor as srcContent
  const [srcContent, setSrcContent] = useState(value)
  const lastEmittedValue = useRef(value)

  // Sync srcContent from props ONLY if the change didn't come from us
  // This prevents the editor from re-initializing while we are typing
  if (value !== lastEmittedValue.current) {
    setSrcContent(value)
    lastEmittedValue.current = value
  }

  const handleEditorUpdate = useCallback(
    (newValue: string) => {
      lastEmittedValue.current = newValue
      onChange(newValue)
    },
    [onChange]
  )

  const handleUseCurrentValue = useCallback(() => {
    if (currentValue !== undefined) {
      setSrcContent(currentValue)
      lastEmittedValue.current = currentValue
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
      <SlateEditor srcContent={srcContent || ''} onUpdate={handleEditorUpdate} disabled={disabled || !usageChecked} label={label} />
    </BaseMatchFieldEditor>
  )
}

export default memo(SlateEditorMatchFieldEditor)
