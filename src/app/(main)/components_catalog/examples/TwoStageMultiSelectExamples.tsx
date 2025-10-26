'use client'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import TwoStageMultiSelect, { TwoStageMultiSelectContent } from '@/components/ui/TwoStageMultiSelect'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// TwoStageMultiSelect Examples

export function TwoStageMultiSelectExamples() {
  const { showToast } = useGlobalToast()

  const [twoStageMultiSelectValue, setTwoStageMultiSelectValue] = useState<MultiSelectItem<TwoStageMultiSelectContent>[]>([
    { value: '1', content: { value: 'Harry Potter', modifier: '1' } },
    { value: '2', content: { value: 'Lord of the Rings', modifier: '3' } }
  ])

  const twoStageMultiSelectItems = [
    { value: '1', content: 'Harry Potter' },
    { value: '2', content: 'Lord of the Rings' },
    { value: '3', content: 'The Hitchhikers Guide to the Galaxy' },
    { value: '4', content: 'The Chronicles of Narnia' },
    { value: '5', content: 'The Hunger Games' },
    { value: '6', content: 'Foundation' },
    { value: '7', content: 'A song of ice and fire' },
    { value: '8', content: 'Robots' }
  ]

  const handleTwoStageMultiSelectItemAdded = (item: MultiSelectItem<TwoStageMultiSelectContent>) => {
    const newItems = [...twoStageMultiSelectValue, item]
    setTwoStageMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      console.log('new item', item)
      showToast(`New item created: ${item.content.value}${item.content.modifier ? ` #${item.content.modifier}` : ''}`, {
        type: 'success',
        title: 'Item Created'
      })
    }
  }

  const handleTwoStageMultiSelectItemRemoved = (item: MultiSelectItem<TwoStageMultiSelectContent>) => {
    const newItems = twoStageMultiSelectValue.filter((i) => i.value !== item.value)
    setTwoStageMultiSelectValue(newItems)
    showToast(`Removed: ${item.content.value}${item.content.modifier ? ` #${item.content.modifier}` : ''}`, { type: 'info', title: 'Item Removed' })
  }

  const handleTwoStageMultiSelectItemEdited = (item: MultiSelectItem<TwoStageMultiSelectContent>, index: number) => {
    const newItems = [...twoStageMultiSelectValue]
    newItems[index] = item
    setTwoStageMultiSelectValue(newItems)
  }

  // Error handlers
  const handleTwoStageValidationError = (error: string) => {
    showToast(error, { type: 'error', title: 'Validation Error' })
  }

  const handleTwoStageDuplicateError = (message: string) => {
    showToast(message, { type: 'warning', title: 'Duplicate Item' })
  }

  return (
    <ComponentExamples title="Two Stage Multi Selects">
      <ComponentInfo component="TwoStageMultiSelect" description="Two-stage multi-select component with primary and modifier values">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <Code overflow>
            import TwoStageMultiSelect, {'{'} TwoStageMultiSelectContent {'}'} from &apos;@/components/ui/TwoStageMultiSelect&apos;
          </Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>selectedItems</Code>, <Code>onItemAdded</Code>, <Code>onItemRemoved</Code>, <Code>onItemEdited</Code>,{' '}
          <Code>items</Code>, <Code>label</Code>, <Code>onValidate</Code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default TwoStageMultiSelect">
          <TwoStageMultiSelect
            selectedItems={twoStageMultiSelectValue}
            onItemAdded={handleTwoStageMultiSelectItemAdded}
            onItemRemoved={handleTwoStageMultiSelectItemRemoved}
            onItemEdited={handleTwoStageMultiSelectItemEdited}
            items={twoStageMultiSelectItems}
            label="Select Series and Sequence"
            onValidate={(content) => {
              if (content.modifier && content.modifier.includes(' ')) {
                return 'A sequence cannot contain any spaces'
              }
              return null
            }}
            onValidationError={handleTwoStageValidationError}
            onDuplicateError={handleTwoStageDuplicateError}
          />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
