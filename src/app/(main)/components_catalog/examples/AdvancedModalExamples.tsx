'use client'

import Modal from '@/components/modals/Modal'
import TabbedModal from '@/components/modals/TabbedModal'
import Btn from '@/components/ui/Btn'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, Example, ExamplesBlock } from '../ComponentExamples'

export function AdvancedModalExamples() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTabbedModalOpen, setIsTabbedModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('details')
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="w-[600px]">
              <div className="p-6 h-full flex flex-col">
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
        <Example title="Tabbed Modal">
          <div>
            <p className="text-gray-400 text-sm mb-4">A modal with tabs and a footer.</p>
            <Btn
              onClick={() => {
                setIsTabbedModalOpen(true)
                setSelectedTab('details')
              }}
            >
              Open Tabbed Modal
            </Btn>

            <TabbedModal
              isOpen={isTabbedModalOpen}
              onClose={() => setIsTabbedModalOpen(false)}
              tabs={[
                { id: 'details', label: 'Details' },
                { id: 'settings', label: 'Settings' },
                { id: 'scanner', label: 'Scanner' },
                { id: 'schedule', label: 'Schedule' }
              ]}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              contentClassName="p-6"
              footer={
                <div className="flex justify-end gap-3">
                  <Btn onClick={() => setIsTabbedModalOpen(false)} color="bg-gray-600">
                    Cancel
                  </Btn>
                  <Btn
                    onClick={() => {
                      showToast(`Saved from "${selectedTab}" tab!`, { type: 'success', title: 'Tabbed Modal' })
                      setIsTabbedModalOpen(false)
                    }}
                    color="bg-success"
                  >
                    Save
                  </Btn>
                </div>
              }
            >
              {selectedTab === 'details' && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Details</h3>
                  <p className="text-foreground-muted">Configure the basic details for this library. Name, description, and other metadata.</p>
                  <div className="bg-primary rounded p-4">
                    <p className="text-sm text-foreground-subdued">This is sample content for the Details tab.</p>
                  </div>
                </div>
              )}
              {selectedTab === 'settings' && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Settings</h3>
                  <p className="text-foreground-muted">Adjust library-level settings such as scan behavior, metadata preferences, and more.</p>
                  <div className="bg-primary rounded p-4">
                    <p className="text-sm text-foreground-subdued">This is sample content for the Settings tab.</p>
                  </div>
                </div>
              )}
              {selectedTab === 'scanner' && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Scanner</h3>
                  <p className="text-foreground-muted">Configure how the scanner processes files in this library.</p>
                  <div className="bg-primary rounded p-4">
                    <p className="text-sm text-foreground-subdued">This is sample content for the Scanner tab.</p>
                  </div>
                </div>
              )}
              {selectedTab === 'schedule' && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Schedule</h3>
                  <p className="text-foreground-muted">Set up automatic scan schedules for this library.</p>
                  <div className="bg-primary rounded p-4">
                    <p className="text-sm text-foreground-subdued">This is sample content for the Schedule tab.</p>
                  </div>
                </div>
              )}
              {selectedTab === 'tools' && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Tools</h3>
                  <p className="text-foreground-muted">Library management tools for bulk operations and maintenance.</p>
                  <div className="bg-primary rounded p-4">
                    <p className="text-sm text-foreground-subdued">This is sample content for the Tools tab.</p>
                  </div>
                </div>
              )}
            </TabbedModal>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
