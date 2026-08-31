'use client'

import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useFormatter } from 'next-intl'
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
  const format = useFormatter()

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

  const currentValueDisplay = hasCurrentValue
    ? t.rich('MessageCurrentlyWithLink', {
        0: format.list(currentValue, { type: 'unit' }),
        link: (chunks) => (
          <a title={t('LabelClickToUseCurrentValue')} className="link-underline cursor-pointer" onClick={handleUseCurrentValue}>
            {chunks}
          </a>
        )
      })
    : null

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
