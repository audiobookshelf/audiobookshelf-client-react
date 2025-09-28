import { MultiSelectItem } from '@/components/ui/MultiSelect'
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function MultiSelectDropdownExamples() {
  const { showToast } = useGlobalToast()

  const multiSelectDropdownItems = [
    { content: 'Red', value: '#ff0000' },
    { content: 'Green', value: '#00ff00' },
    { content: 'Blue', value: '#0000ff' },
    { content: 'Yellow', value: '#ffff00' },
    { content: 'Purple', value: '#800080' }
  ]
  const [multiSelectDropdownSelectedItems, setMultiSelectDropdownSelectedItems] = useState<MultiSelectItem[]>([
    { content: 'Red', value: '#ff0000' },
    { content: 'Blue', value: '#0000ff' }
  ])

  const handleMultiSelectDropdownItemAdded = (item: MultiSelectItem) => {
    const newItems = [...multiSelectDropdownSelectedItems, item]
    setMultiSelectDropdownSelectedItems(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleMultiSelectDropdownItemRemoved = (item: MultiSelectItem) => {
    const newItems = multiSelectDropdownSelectedItems.filter((i) => i.value !== item.value)
    setMultiSelectDropdownSelectedItems(newItems)
    showToast(`Removed: ${item.content}`, { type: 'info', title: 'Item Removed' })
  }

  return (
    <ComponentExamples title="Multi Select Dropdowns">
      <ComponentInfo component="MultiSelectDropdown" description="Multi-select dropdown component with item management">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import MultiSelectDropdown from &apos;@/components/ui/MultiSelectDropdown&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">selectedItems</code> (MultiSelectItem[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onItemAdded</code>, <code className="bg-gray-700 px-2 py-1 rounded">onItemRemoved</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">items</code> (MultiSelectItem[]), <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default MultiSelectDropdown">
          <MultiSelectDropdown
            selectedItems={multiSelectDropdownSelectedItems}
            onItemAdded={handleMultiSelectDropdownItemAdded}
            onItemRemoved={handleMultiSelectDropdownItemRemoved}
            items={multiSelectDropdownItems}
            label="Select Colors"
          />
        </Example>
        <Example title="Disabled MultiSelectDropdown">
          <MultiSelectDropdown
            selectedItems={multiSelectDropdownSelectedItems}
            onItemAdded={handleMultiSelectDropdownItemAdded}
            onItemRemoved={handleMultiSelectDropdownItemRemoved}
            items={multiSelectDropdownItems}
            label="Select Colors"
            disabled
          />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
