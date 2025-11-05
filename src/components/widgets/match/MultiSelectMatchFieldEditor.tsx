'use client'

import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { memo, useCallback } from 'react'
import { BaseMatchFieldEditor } from './BaseMatchFieldEditor'

interface MultiSelectMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (checked: boolean) => void
  selectedItems: MultiSelectItem<string>[]
  items: MultiSelectItem<string>[]
  onItemAdded: (item: MultiSelectItem<string>) => void
  onItemRemoved: (item: MultiSelectItem<string>) => void
  disabled?: boolean
  label: string
  currentValue?: string[]
  allowNew?: boolean
  onReplaceAll?: (items: string[]) => void
}

function MultiSelectMatchFieldEditor({
  usageChecked,
  onUsageChange,
  selectedItems,
  items,
  onItemAdded,
  onItemRemoved,
  disabled,
  label,
  currentValue,
  allowNew,
  onReplaceAll
}: MultiSelectMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const handleUseCurrentValue = useCallback(() => {
    if (currentValue && currentValue.length > 0) {
      if (onReplaceAll) {
        onReplaceAll(currentValue)
      } else {
        // Fallback: add all items
        currentValue.forEach((val) => {
          onItemAdded({ value: val, content: val })
        })
      }
    }
  }, [currentValue, onReplaceAll, onItemAdded])

  const hasCurrentValue = currentValue !== undefined && currentValue.length > 0

  const currentValueDisplay = hasCurrentValue ? (
    <>
      {t('LabelCurrently')}{' '}
      <a title={t('LabelClickToUseCurrentValue')} className="cursor-pointer hover:underline" onClick={handleUseCurrentValue}>
        {currentValue.join(', ')}
      </a>
    </>
  ) : null

  return (
    <BaseMatchFieldEditor usageChecked={usageChecked} onUsageChange={onUsageChange} currentValueDisplay={currentValueDisplay} hasCurrentValue={hasCurrentValue}>
      <MultiSelect
        selectedItems={selectedItems}
        onItemAdded={onItemAdded}
        onItemRemoved={onItemRemoved}
        disabled={disabled || !usageChecked}
        label={label}
        items={items}
        allowNew={allowNew}
      />
    </BaseMatchFieldEditor>
  )
}

export default memo(MultiSelectMatchFieldEditor)
