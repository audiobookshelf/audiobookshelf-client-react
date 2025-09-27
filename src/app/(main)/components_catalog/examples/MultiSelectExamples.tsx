import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function MultiSelectExamples() {
  const { showToast } = useGlobalToast()

  // MultiSelect sample data
  const multiSelectItems: MultiSelectItem[] = [
    { content: 'Apple', value: 'apple' },
    { content: 'Banana', value: 'banana' },
    { content: 'Cherry', value: 'cherry' },
    { content: 'Date', value: 'date' },
    { content: 'Elderberry', value: 'elderberry' },
    { content: 'Fig', value: 'fig' },
    { content: 'Grape', value: 'grape' },
    { content: 'Honeydew', value: 'honeydew' }
  ]
  const [multiSelectValue, setMultiSelectValue] = useState<MultiSelectItem[]>([
    { content: 'Apple', value: 'apple' },
    { content: 'Banana', value: 'banana' }
  ])

  // MultiSelect handlers
  const handleMultiSelectItemAdded = (item: MultiSelectItem) => {
    const newItems = [...multiSelectValue, item]
    setMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleMultiSelectItemRemoved = (item: MultiSelectItem) => {
    const newItems = multiSelectValue.filter((i) => i.value !== item.value)
    setMultiSelectValue(newItems)
    showToast(`Removed: ${item.content}`, { type: 'info', title: 'Item Removed' })
  }

  const handleMultiSelectItemEdited = (item: MultiSelectItem, index: number) => {
    const newItems = [...multiSelectValue]
    newItems[index] = item
    setMultiSelectValue(newItems)
    showToast(`Edited: ${item.content}`, { type: 'info', title: 'Item Edited' })
  }

  // Error handlers
  const handleValidationError = (error: string) => {
    showToast(error, { type: 'error', title: 'Validation Error' })
  }

  const handleDuplicateError = (message: string) => {
    showToast(message, { type: 'warning', title: 'Duplicate Item' })
  }

  return (
    <ComponentExamples title="Multi Selects">
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <ComponentInfo component="MultiSelect" description="Multi-select component with item management, editing, and validation">
          <p className="mb-2">
            <span className="font-bold">Import:</span>{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">
              import MultiSelect, {'{'} MultiSelectItem {'}'} from &apos;@/components/ui/MultiSelect&apos;
            </code>
          </p>
          <p className="mb-2">
            <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">selectedItems</code> (MultiSelectItem[]),{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">onItemAdded</code>, <code className="bg-gray-700 px-2 py-1 rounded">onItemRemoved</code>,{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">onItemEdited</code>, <code className="bg-gray-700 px-2 py-1 rounded">items</code>{' '}
            (MultiSelectItem[]), <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">showEdit</code>, <code className="bg-gray-700 px-2 py-1 rounded">onValidate</code>
          </p>
        </ComponentInfo>
      </div>

      <ExamplesBlock>
        <Example title="Default MultiSelect">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            items={multiSelectItems}
            label="Select Fruits"
            onValidationError={handleValidationError}
            onDuplicateError={handleDuplicateError}
          />
        </Example>

        <Example title="MultiSelect with Edit">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            onItemEdited={handleMultiSelectItemEdited}
            items={multiSelectItems}
            label="Select Fruits"
            showEdit
            onValidationError={handleValidationError}
            onDuplicateError={handleDuplicateError}
          />
        </Example>

        <Example title="Disabled MultiSelect">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            items={multiSelectItems}
            label="Select Fruits"
            disabled
            onValidationError={handleValidationError}
            onDuplicateError={handleDuplicateError}
          />
        </Example>

        <Example title="MultiSelect with Validation">
          <MultiSelect
            selectedItems={multiSelectValue}
            onItemAdded={handleMultiSelectItemAdded}
            onItemRemoved={handleMultiSelectItemRemoved}
            onItemEdited={handleMultiSelectItemEdited}
            items={multiSelectItems}
            label="Select Fruits"
            showEdit
            onValidate={(content) => {
              if (content.includes(' ')) {
                return 'A fruit name cannot contain any spaces'
              }
              return null
            }}
            onValidationError={handleValidationError}
            onDuplicateError={handleDuplicateError}
          />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
