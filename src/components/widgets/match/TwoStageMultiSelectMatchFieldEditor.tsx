'use client'

import { MultiSelectItem } from '@/components/ui/MultiSelect'
import TwoStageMultiSelect from '@/components/ui/TwoStageMultiSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { SeriesMinified } from '@/types/api'
import { memo, useCallback } from 'react'
import { BaseMatchFieldEditor } from './BaseMatchFieldEditor'

interface TwoStageMultiSelectMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (checked: boolean) => void
  selectedItems: MultiSelectItem<{ value: string; modifier: string }>[]
  items: MultiSelectItem<string>[]
  onItemAdded: (item: MultiSelectItem<{ value: string; modifier: string }>) => void
  onItemRemoved: (item: MultiSelectItem<{ value: string; modifier: string }>) => void
  onItemEdited: (item: MultiSelectItem<{ value: string; modifier: string }>, index: number) => void
  disabled?: boolean
  label: string
  currentValue?: SeriesMinified[]
  onReplaceAll?: (items: SeriesMinified[]) => void
}

function TwoStageMultiSelectMatchFieldEditor({
  usageChecked,
  onUsageChange,
  selectedItems,
  items,
  onItemAdded,
  onItemRemoved,
  onItemEdited,
  disabled,
  label,
  currentValue,
  onReplaceAll
}: TwoStageMultiSelectMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const handleUseCurrentValue = useCallback(() => {
    if (currentValue && currentValue.length > 0) {
      if (onReplaceAll) {
        onReplaceAll(currentValue)
      } else {
        // Fallback: add all items
        currentValue.forEach((series) => {
          onItemAdded({
            value: series.id || `new-${Math.floor(Math.random() * 10000)}`,
            content: { value: series.name, modifier: series.sequence || '' }
          })
        })
      }
    }
  }, [currentValue, onReplaceAll, onItemAdded])

  const hasCurrentValue = currentValue !== undefined && currentValue.length > 0

  const formattedValue = currentValue ? currentValue.map((s) => (s.sequence ? `${s.name} #${s.sequence}` : s.name)).join(', ') : ''

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
      <TwoStageMultiSelect
        selectedItems={selectedItems}
        items={items}
        onItemAdded={onItemAdded}
        onItemRemoved={onItemRemoved}
        onItemEdited={onItemEdited}
        disabled={disabled || !usageChecked}
        label={label}
      />
    </BaseMatchFieldEditor>
  )
}

export default memo(TwoStageMultiSelectMatchFieldEditor)
