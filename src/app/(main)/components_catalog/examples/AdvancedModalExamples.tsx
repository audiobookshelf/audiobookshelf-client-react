import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import { ComponentExamples, ExamplesBlock, Example } from '../ComponentExamples'
import Btn from '@/components/ui/Btn'
import Modal from '@/components/modals/Modal'
import MultiSelect from '@/components/ui/MultiSelect'

export function AdvancedModalExamples() {
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  return (
    <ComponentExamples title="Advanced Modal Examples">
      <ExamplesBlock>
        <Example title="MultiSelect within Modal Dialog">
          <div>
            <p className="text-gray-400 text-sm mb-4">This example shows how MultiSelect works inside a modal dialog.</p>
            <Btn onClick={() => setIsModalOpen(true)}>Open Modal with MultiSelect</Btn>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} width={600}>
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                  <h3 className="text-xl font-semibold text-white">Edit Tags</h3>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-1">
                  <p className="text-gray-300 text-sm">Select or add tags for this item.</p>

                  <MultiSelect
                    selectedItems={multiSelectValue}
                    onItemAdded={handleMultiSelectItemAdded}
                    onItemRemoved={handleMultiSelectItemRemoved}
                    onItemEdited={handleMultiSelectItemEdited}
                    items={multiSelectItems}
                    label="Item Tags"
                    showEdit
                  />

                  <div className="text-xs text-gray-400 mt-2">
                    Current selection: {multiSelectValue.length > 0 ? multiSelectValue.map((i) => i.content).join(', ') : 'None'}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Btn onClick={() => setIsModalOpen(false)} color="bg-gray-600">
                    Cancel
                  </Btn>
                  <Btn onClick={() => setIsModalOpen(false)} color="bg-blue-600">
                    Save Changes
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
