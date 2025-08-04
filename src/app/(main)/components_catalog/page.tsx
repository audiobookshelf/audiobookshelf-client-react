'use client'

import { useState, useEffect, useMemo } from 'react'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import IconBtn from '@/components/ui/IconBtn'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import type { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import Dropdown from '@/components/ui/Dropdown'
import type { DropdownItem } from '@/components/ui/Dropdown'
import InputDropdown from '@/components/ui/InputDropdown'
import FileInput from '@/components/ui/FileInput'
import LibraryIcon from '@/components/ui/LibraryIcon'
import MediaIconPicker from '@/components/ui/MediaIconPicker'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'
import { useGlobalToast } from '@/contexts/ToastContext'
import Modal from '@/components/modals/Modal'
import TwoStageMultiSelect, { TwoStageMultiSelectContent } from '@/components/ui/TwoStageMultiSelect'

export default function ComponentsCatalogPage() {
  const { showToast } = useGlobalToast()
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [checkboxValue2, setCheckboxValue2] = useState(true)
  const [checkboxValue3, setCheckboxValue3] = useState(false)

  // Dropdown sample data
  const dropdownItems: DropdownItem[] = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2', value: 'option2' },
    { text: 'Option 3', value: 'option3' },
    { text: 'Option 4', value: 'option4' }
  ]

  const dropdownItemsWithSubtext: DropdownItem[] = [
    { text: 'English', value: 'en', subtext: 'US' },
    { text: 'Spanish', value: 'es', subtext: 'ES' },
    { text: 'French', value: 'fr', subtext: 'FR' },
    { text: 'German', value: 'de', subtext: 'DE' }
  ]

  const [dropdownValue, setDropdownValue] = useState('option1')
  const [dropdownValue2, setDropdownValue2] = useState('en')
  const [dropdownValue3, setDropdownValue3] = useState('option1')
  const [mediaIconValue, setMediaIconValue] = useState('audiobookshelf')

  // InputDropdown sample data
  const inputDropdownItems = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']
  const [inputDropdownValue, setInputDropdownValue] = useState('')
  const [inputDropdownValue2, setInputDropdownValue2] = useState('')
  const [inputDropdownValue3, setInputDropdownValue3] = useState('')

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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false)
  const [isOuterContentModalOpen, setIsOuterContentModalOpen] = useState(false)
  const [isResponsiveModalOpen, setIsResponsiveModalOpen] = useState(false)
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [isPersistentModalOpen, setIsPersistentModalOpen] = useState(false)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modalMultiSelectValue, setModalMultiSelectValue] = useState<MultiSelectItem[]>([
    { content: 'Cherry', value: 'cherry' },
    { content: 'Date', value: 'date' }
  ])

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

  const handleTwoStageMultiSelectItemAdded = (item: any) => {
    const newItems = [...twoStageMultiSelectValue, item]
    setTwoStageMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content.text1}${item.content.text2 ? ` #${item.content.text2}` : ''}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleTwoStageMultiSelectItemRemoved = (item: any) => {
    const newItems = twoStageMultiSelectValue.filter((i) => i.value !== item.value)
    setTwoStageMultiSelectValue(newItems)
    showToast(`Removed: ${item.content.text1}${item.content.text2 ? ` #${item.content.text2}` : ''}`, { type: 'info', title: 'Item Removed' })
  }

  const handleTwoStageMultiSelectItemEdited = (item: any, index: number) => {
    const newItems = [...twoStageMultiSelectValue]
    newItems[index] = item
    setTwoStageMultiSelectValue(newItems)
  }

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

  const handleModalMultiSelectItemAdded = (item: MultiSelectItem) => {
    const newItems = [...modalMultiSelectValue, item]
    setModalMultiSelectValue(newItems)
    if (item.value.startsWith('new-')) {
      showToast(`New item created: ${item.content}`, { type: 'success', title: 'Item Created' })
    }
  }

  const handleModalMultiSelectItemRemoved = (item: MultiSelectItem) => {
    const newItems = modalMultiSelectValue.filter((i) => i.value !== item.value)
    setModalMultiSelectValue(newItems)
    showToast(`Removed tag: ${item.content}`, { type: 'info', title: 'Tag Removed' })
  }

  const handleModalMultiSelectItemEdited = (item: MultiSelectItem, index: number) => {
    const newItems = [...modalMultiSelectValue]
    newItems[index] = item
    setModalMultiSelectValue(newItems)
    showToast(`Edited tag: ${item.content}`, { type: 'info', title: 'Tag Edited' })
  }

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

  // Dropdown change handlers
  const handleDropdownChange = (value: string | number) => {
    setDropdownValue(String(value))
  }

  const handleDropdownChange2 = (value: string | number) => {
    setDropdownValue2(String(value))
  }

  const handleDropdownChange3 = (value: string | number) => {
    setDropdownValue3(String(value))
  }

  // InputDropdown change handlers
  const handleInputDropdownChange = (value: string | number) => {
    setInputDropdownValue(String(value))
  }

  const handleInputDropdownChange2 = (value: string | number) => {
    setInputDropdownValue2(String(value))
  }

  const handleInputDropdownChange3 = (value: string | number) => {
    setInputDropdownValue3(String(value))
  }

  const handleInputDropdownNewItem = (value: string) => {
    showToast(`New item created: ${value}`, { type: 'success', title: 'Item Created' })
  }

  // Helper function to simulate processing
  const handleProcessingDemo = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setIsProcessingModalOpen(false)
      showToast('Processing completed!', { type: 'success', title: 'Success' })
    }, 3000)
  }

  // ContextMenuDropdown sample data
  const contextMenuItems: ContextMenuDropdownItem[] = [
    { text: 'Edit', action: 'edit' },
    { text: 'Delete', action: 'delete' },
    {
      text: 'More Options',
      action: 'more',
      subitems: [
        { text: 'Copy', action: 'copy' },
        { text: 'Move', action: 'move' },
        { text: 'Share', action: 'share' }
      ]
    },
    {
      text: 'More Options 2',
      action: 'more2',
      subitems: [
        { text: 'Copy 2', action: 'copy2' },
        { text: 'Move 2', action: 'move2' },
        { text: 'Share 2', action: 'share2' }
      ]
    }
  ]

  const contextMenuItemsWithData: ContextMenuDropdownItem[] = [
    { text: 'Edit Item', action: 'edit' },
    { text: 'Delete Item', action: 'delete' },
    {
      text: 'Advanced',
      action: 'advanced',
      subitems: [
        { text: 'Duplicate', action: 'duplicate', data: { id: 1 } },
        { text: 'Archive', action: 'archive', data: { id: 1 } }
      ]
    }
  ]

  const contextMenuItemsWithEmptySubitems: ContextMenuDropdownItem[] = [
    { text: 'Edit Item', action: 'edit' },
    { text: 'Delete Item', action: 'delete' },
    { text: 'Empty', action: 'empty', subitems: [] }
  ]

  const seriesItems: MultiSelectItem[] = [
    { content: 'Lord of the Rings', value: '1' },
    { content: 'Foundation', value: '2' },
    { content: 'The Hitchhikers Guide to the Galaxy', value: '3' },
    { content: 'The Chronicles of Narnia', value: '4' },
    { content: 'Harry Potter', value: '5' },
    { content: 'The Hunger Games', value: '6' },
    { content: 'A very very very very very very very very very very very very long series name', value: '7' }
  ]
  const [seriesSelectedItems, setSeriesSelectedItems] = useState<MultiSelectItem[]>([
    { value: '1', content: 'Lord of the Rings#1' },
    { value: '3', content: 'The Hitchhikers Guide to the Galaxy#2' }
  ])

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Components Catalog</h1>
        <p className="text-gray-300 mb-6">This page showcases all the available UI components in the audiobookshelf client.</p>
      </div>

      {/* Button Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Button Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Primary Button</h3>
            <Btn>Primary Button</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Button</h3>
            <Btn small>Small Button</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Button</h3>
            <Btn loading>Loading...</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Loading Button</h3>
            <Btn small loading>
              Loading...
            </Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Button</h3>
            <Btn disabled>Disabled Button</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Button with Progress</h3>
            <Btn loading progress="75%">
              Uploading...
            </Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Link Button</h3>
            <Btn to="/settings">Go to Settings</Btn>
          </div>
        </div>
      </section>

      {/* Icon Button Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Icon Button Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Icon Button</h3>
            <IconBtn icon="&#xe3c9;" ariaLabel="Edit" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Outlined Icon Button</h3>
            <IconBtn icon="&#xe5ca;" outlined ariaLabel="Close" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Borderless Icon Button</h3>
            <IconBtn icon="&#xe3c9;" borderless ariaLabel="Edit" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Icon Button</h3>
            <IconBtn icon="&#xe3c9;" loading ariaLabel="Loading" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Icon Button</h3>
            <IconBtn icon="&#xe3c9;" disabled ariaLabel="Edit" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Size Icon Button</h3>
            <IconBtn icon="&#xe3c9;" size={12} ariaLabel="Large Edit" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Color Icon Button</h3>
            <IconBtn icon="&#xe5ca;" bgColor="bg-red-500" ariaLabel="Delete" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Font Size Icon Button</h3>
            <IconBtn icon="&#xe3c9;" iconFontSize="2rem" ariaLabel="Large Edit" />
          </div>
        </div>
      </section>

      {/* Context Menu Dropdown Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Context Menu Dropdown Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Context Menu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItems}
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
              <span className="text-sm text-gray-400">Click to see menu</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Left Aligned Context Menu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItems}
                menuAlign="left"
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
              <span className="text-sm text-gray-400">Click to see menu</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Context Menu with Data</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItemsWithData}
                onAction={(action) =>
                  showToast(`Action: ${action.action} ${action.data ? `, Data: ${JSON.stringify(action.data)}` : ''}`, {
                    type: 'info',
                    title: 'Context Menu Action'
                  })
                }
              />
              <span className="text-sm text-gray-400">Click to see menu with data</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Context Menu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItems}
                disabled={true}
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
              <span className="text-sm text-gray-400">Disabled state</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Processing Context Menu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItems}
                processing={true}
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
              <span className="text-sm text-gray-400">Loading state</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Icon Context Menu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItems}
                iconClass="text-blue-400"
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
              <span className="text-sm text-gray-400">Custom icon color</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Wide Context Menu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItems}
                menuWidth={250}
                menuAlign="left"
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
              <span className="text-sm text-gray-400">Wider menu</span>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Context Menu with Empty Submenu</h3>
            <div className="flex items-center gap-4">
              <ContextMenuDropdown
                items={contextMenuItemsWithEmptySubitems}
                onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dropdown Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Dropdown Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Dropdown</h3>
            <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Select Option" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Dropdown with Subtext</h3>
            <Dropdown value={dropdownValue2} onChange={handleDropdownChange2} items={dropdownItemsWithSubtext} label="Language" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Dropdown</h3>
            <Dropdown value={dropdownValue3} onChange={handleDropdownChange3} items={dropdownItems} label="Small Option" small />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Dropdown</h3>
            <Dropdown value="option1" items={dropdownItems} label="Disabled Option" disabled />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Dropdown without Label</h3>
            <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Height Dropdown</h3>
            <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Custom Height" menuMaxHeight="100px" />
          </div>
        </div>
      </section>

      {/* Input Dropdown Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Input Dropdown Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Input Dropdown</h3>
            <InputDropdown value={inputDropdownValue} onChange={handleInputDropdownChange} items={inputDropdownItems} label="Select Fruit" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Input Dropdown with New Item Creation</h3>
            <InputDropdown
              value={inputDropdownValue2}
              onChange={handleInputDropdownChange2}
              items={inputDropdownItems}
              label="Add or Select Fruit"
              onNewItem={handleInputDropdownNewItem}
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Show All When Empty</h3>
            <InputDropdown
              value={inputDropdownValue3}
              onChange={handleInputDropdownChange3}
              items={inputDropdownItems}
              label="Fruit with Show All"
              showAllWhenEmpty
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Input Dropdown</h3>
            <InputDropdown value="Apple" items={inputDropdownItems} label="Disabled Fruit" disabled />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Input Dropdown without Label</h3>
            <InputDropdown value={inputDropdownValue} onChange={handleInputDropdownChange} items={inputDropdownItems} />
          </div>
        </div>
      </section>

      {/* MultiSelect Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">MultiSelect Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default MultiSelect</h3>
            <MultiSelect
              selectedItems={multiSelectValue}
              onItemAdded={handleMultiSelectItemAdded}
              onItemRemoved={handleMultiSelectItemRemoved}
              items={multiSelectItems}
              label="Select Fruits"
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">MultiSelect with Edit</h3>
            <MultiSelect
              selectedItems={multiSelectValue}
              onItemAdded={handleMultiSelectItemAdded}
              onItemRemoved={handleMultiSelectItemRemoved}
              onItemEdited={handleMultiSelectItemEdited}
              items={multiSelectItems}
              label="Select Fruits"
              showEdit
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled MultiSelect</h3>
            <MultiSelect
              selectedItems={multiSelectValue}
              onItemAdded={handleMultiSelectItemAdded}
              onItemRemoved={handleMultiSelectItemRemoved}
              items={multiSelectItems}
              label="Select Fruits"
              disabled
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">MultiSelect with Validation</h3>
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
            />
          </div>
        </div>
      </section>

      {/* TwoStageMultiSelect Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">TwoStageMultiSelect Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default TwoStageMultiSelect</h3>
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
            />
          </div>
        </div>
      </section>

      {/* MultiSelectDropdown Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">MultiSelectDropdown Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default MultiSelectDropdown</h3>
            <MultiSelectDropdown
              selectedItems={multiSelectDropdownSelectedItems}
              onItemAdded={handleMultiSelectDropdownItemAdded}
              onItemRemoved={handleMultiSelectDropdownItemRemoved}
              items={multiSelectDropdownItems}
              label="Select Colors"
            />
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled MultiSelectDropdown</h3>
            <MultiSelectDropdown
              selectedItems={multiSelectDropdownSelectedItems}
              onItemAdded={handleMultiSelectDropdownItemAdded}
              onItemRemoved={handleMultiSelectDropdownItemRemoved}
              items={multiSelectDropdownItems}
              label="Select Colors"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Modal Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Modal Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Basic Modal</h3>
            <p className="text-gray-400 text-sm mb-4">A simple modal with default settings and close functionality.</p>
            <Btn onClick={() => setIsBasicModalOpen(true)}>Open Basic Modal</Btn>

            <Modal isOpen={isBasicModalOpen} onClose={() => setIsBasicModalOpen(false)}>
              <div className="bg-gray-800 rounded-lg p-6 max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">Basic Modal Example</h3>
                <p className="text-gray-300 mb-6">
                  This is a basic modal dialog. You can close it by clicking the close button, pressing Escape, or clicking outside the modal content.
                </p>
                <div className="flex justify-end gap-3">
                  <Btn onClick={() => setIsBasicModalOpen(false)} color="bg-gray-600">
                    Close
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Processing Modal</h3>
            <p className="text-gray-400 text-sm mb-4">A modal with a processing overlay that prevents interaction during operations.</p>
            <Btn onClick={() => setIsProcessingModalOpen(true)}>Open Processing Modal</Btn>

            <Modal isOpen={isProcessingModalOpen} onClose={() => setIsProcessingModalOpen(false)} processing={isProcessing} width={500} height={300}>
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Processing Example</h3>
                <p className="text-gray-300 mb-6 flex-1">
                  Click the "Start Processing" button to see the processing overlay in action. The modal will be disabled during processing.
                </p>
                <div className="flex justify-end gap-3">
                  <Btn onClick={() => setIsProcessingModalOpen(false)} color="bg-gray-600">
                    Cancel
                  </Btn>
                  <Btn onClick={handleProcessingDemo} color="bg-blue-600" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Start Processing'}
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Persistent Modal</h3>
            <p className="text-gray-400 text-sm mb-4">A modal that cannot be closed by clicking outside or pressing Escape.</p>
            <Btn onClick={() => setIsPersistentModalOpen(true)}>Open Persistent Modal</Btn>

            <Modal
              isOpen={isPersistentModalOpen}
              onClose={() => setIsPersistentModalOpen(false)}
              persistent={true}
              width={450}
              height={250}
              bgOpacityClass="bg-primary/90"
            >
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Persistent Modal</h3>
                <p className="text-gray-300 mb-6 flex-1">
                  This modal is persistent - you can only close it by clicking the "Close" button. Background clicks and Escape key are disabled.
                </p>
                <div className="flex justify-center">
                  <Btn onClick={() => setIsPersistentModalOpen(false)} color="bg-red-600">
                    Close Modal
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Styled Modal</h3>
            <p className="text-gray-400 text-sm mb-4">A modal with custom dimensions and Tailwind z-index/opacity classes.</p>
            <Btn onClick={() => setIsCustomModalOpen(true)}>Open Custom Modal</Btn>

            <Modal
              isOpen={isCustomModalOpen}
              onClose={() => setIsCustomModalOpen(false)}
              width={800}
              height={600}
              zIndexClass="z-[100]"
              bgOpacityClass="bg-primary/50"
              contentMarginTop={20}
            >
              <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-8 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-6">Custom Styled Modal</h3>
                <div className="flex-1 space-y-4">
                  <p className="text-blue-100">This modal demonstrates custom styling options:</p>
                  <ul className="list-disc list-inside text-blue-100 space-y-2">
                    <li>Custom width (800px) and height (600px)</li>
                    <li>Higher z-index (z-[100]) using Tailwind classes</li>
                    <li>Lower background opacity (bg-primary/50) using Tailwind classes</li>
                    <li>Custom margin top (20px)</li>
                    <li>Gradient background styling</li>
                  </ul>
                  <div className="bg-blue-800/30 rounded p-4 mt-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Modal Features</h4>
                    <p className="text-blue-100 text-sm">
                      The Modal component supports focus management, keyboard navigation, smooth animations, and portal rendering for proper z-index handling.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-blue-700">
                  <Btn onClick={() => setIsCustomModalOpen(false)} color="bg-blue-600">
                    Close Custom Modal
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Modal with Outer Content</h3>
            <p className="text-gray-400 text-sm mb-4">A modal that can display content outside the main modal area.</p>
            <Btn onClick={() => setIsOuterContentModalOpen(true)}>Open with Outer Content</Btn>

            <Modal
              isOpen={isOuterContentModalOpen}
              onClose={() => setIsOuterContentModalOpen(false)}
              width={400}
              height={300}
              outerContent={<div className="absolute top-10 left-10 bg-yellow-500 text-black px-3 py-1 rounded text-sm font-semibold">Outer Content!</div>}
            >
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Modal with Outer Content</h3>
                <p className="text-gray-300 mb-6 flex-1">
                  This modal has additional content rendered outside the main modal container. Check the yellow badge in the top-left corner.
                </p>
                <div className="flex justify-end">
                  <Btn onClick={() => setIsOuterContentModalOpen(false)} color="bg-gray-600">
                    Close
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Responsive Modal</h3>
            <p className="text-gray-400 text-sm mb-4">A modal that adapts to different screen sizes using string dimensions.</p>
            <Btn onClick={() => setIsResponsiveModalOpen(true)}>Open Responsive Modal</Btn>

            <Modal isOpen={isResponsiveModalOpen} onClose={() => setIsResponsiveModalOpen(false)} width="90vw" height="80vh">
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4">Responsive Modal</h3>
                <div className="flex-1 space-y-4">
                  <p className="text-gray-300">This modal uses viewport units for its dimensions:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Width: 90vw (90% of viewport width)</li>
                    <li>Height: 80vh (80% of viewport height)</li>
                    <li>Automatically adapts to screen size</li>
                    <li>Perfect for mobile devices</li>
                  </ul>
                  <div className="bg-gray-700 rounded p-4">
                    <p className="text-sm text-gray-300">Try resizing your browser window to see how the modal adapts to different screen sizes.</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-600">
                  <Btn onClick={() => setIsResponsiveModalOpen(false)} color="bg-gray-600">
                    Close
                  </Btn>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </section>

      {/* MultiSelect in Modal */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Advanced Modal Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">MultiSelect within Modal Dialog</h3>
            <p className="text-gray-400 text-sm mb-4">This example shows how MultiSelect works inside a modal dialog.</p>
            <Btn onClick={() => setIsModalOpen(true)}>Open Modal with MultiSelect</Btn>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} width={600}>
              <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-600 pb-4">
                  <h3 className="text-xl font-semibold text-white">Edit Tags</h3>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-1">
                  <p className="text-gray-300 text-sm">Select or add tags for this item.</p>

                  <MultiSelect
                    selectedItems={modalMultiSelectValue}
                    onItemAdded={handleModalMultiSelectItemAdded}
                    onItemRemoved={handleModalMultiSelectItemRemoved}
                    onItemEdited={handleModalMultiSelectItemEdited}
                    items={multiSelectItems}
                    label="Item Tags"
                    showEdit
                  />

                  <div className="text-xs text-gray-400 mt-2">
                    Current selection: {modalMultiSelectValue.length > 0 ? modalMultiSelectValue.map((i) => i.content).join(', ') : 'None'}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-600">
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
        </div>
      </section>

      {/* Checkbox Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Checkbox Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Checkbox</h3>
            <Checkbox value={checkboxValue} onChange={setCheckboxValue} label="Default checkbox" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Checked Checkbox</h3>
            <Checkbox value={checkboxValue2} onChange={setCheckboxValue2} label="Checked checkbox" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Small Checkbox</h3>
            <Checkbox value={checkboxValue3} onChange={setCheckboxValue3} label="Small checkbox" small />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Medium Checkbox</h3>
            <Checkbox value={false} label="Medium checkbox" medium />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled Checkbox</h3>
            <Checkbox value={true} label="Disabled checkbox" disabled />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Partial Checkbox</h3>
            <Checkbox value={false} label="Partial checkbox" partial />
          </div>
        </div>
      </section>

      {/* File Input Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">File Input Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default File Input</h3>
            <FileInput onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}>Choose File</FileInput>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Document File Input</h3>
            <FileInput
              accept=".pdf, .doc, .docx, .txt"
              onChange={(file) => showToast(`Selected document: ${file.name}`, { type: 'success', title: 'Document Selected' })}
              ariaLabel="Upload Document"
            >
              Upload Document
            </FileInput>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">All Files Input</h3>
            <FileInput
              accept="*"
              onChange={(file) => showToast(`Selected file: ${file.name}`, { type: 'success', title: 'File Selected' })}
              ariaLabel="Upload Any File"
            >
              Choose Any File
            </FileInput>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Styled File Input</h3>
            <FileInput
              accept=".png, .jpg, .jpeg"
              onChange={(file) => showToast(`Selected image: ${file.name}`, { type: 'success', title: 'Image Selected' })}
              className="border-2 border-dashed border-blue-400 rounded-lg bg-blue-50"
              ariaLabel="Upload Image"
            >
              Drop Image Here
            </FileInput>
          </div>
        </div>
      </section>

      {/* Library Icon Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Library Icon Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Library Icon</h3>
            <div className="bg-gray-700 p-2 rounded-lg">
              <LibraryIcon />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Large Size</h3>
            <div className="bg-gray-700 p-2 rounded-lg">
              <LibraryIcon size={6} />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Icon</h3>
            <LibraryIcon icon="books-1" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Font Size</h3>
            <LibraryIcon fontSize="text-3xl" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Icon with Large Size</h3>
            <LibraryIcon icon="headphones" size={6} fontSize="text-3xl" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Invalid Icon (Falls Back to Default)</h3>
            <LibraryIcon icon="invalid-icon" />
          </div>
        </div>
      </section>

      {/* Media Icon Picker Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Media Icon Picker Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Default Media Icon Picker</h3>
            <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Custom Label & Value</h3>
            <MediaIconPicker value="books-1" onChange={setMediaIconValue} label="Choose Books Icon" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Disabled State</h3>
            <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} label="Disabled Picker" disabled />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Menu Alignment (Right)</h3>
            <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} align="right" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Menu Alignment (Center)</h3>
            <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} align="center" />
          </div>
        </div>
      </section>

      {/* Loading Components */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Loading Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Indicator</h3>
            <LoadingIndicator />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Spinner (Default - Small)</h3>
            <LoadingSpinner />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Spinner (Large)</h3>
            <LoadingSpinner size="la-lg" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Spinner (2x)</h3>
            <LoadingSpinner size="la-2x" />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Spinner (3x)</h3>
            <LoadingSpinner size="la-3x" />
          </div>

          <div className="bg-gray-500 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Spinner (Dark - Large)</h3>
            <LoadingSpinner size="la-lg" dark />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Loading Spinner (Custom Color - Large)</h3>
            <LoadingSpinner size="la-lg" color="#ff6b6b" />
          </div>
        </div>
      </section>

      {/* Toast Notification Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Toast Notification Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Success Toast</h3>
            <Btn onClick={() => showToast('Operation completed successfully!', { type: 'success', title: 'Success' })}>Show Success</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Error Toast</h3>
            <Btn onClick={() => showToast('Something went wrong!', { type: 'error', title: 'Error' })}>Show Error</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Warning Toast</h3>
            <Btn onClick={() => showToast('Please be careful!', { type: 'warning', title: 'Warning' })}>Show Warning</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Info Toast</h3>
            <Btn onClick={() => showToast('Here is some information.', { type: 'info', title: 'Information' })}>Show Info</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Long Duration Toast</h3>
            <Btn onClick={() => showToast('This toast will stay for 10 seconds.', { type: 'info', title: 'Long Toast', duration: 10000 })}>Show Long Toast</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">No Auto-Dismiss Toast</h3>
            <Btn onClick={() => showToast('This toast will not auto-dismiss.', { type: 'warning', title: 'Persistent', duration: 0 })}>Show Persistent</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Toast with Title Only</h3>
            <Btn onClick={() => showToast('Just a simple message.', { type: 'info' })}>Show Simple</Btn>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Multiple Toasts</h3>
            <Btn
              onClick={() => {
                showToast('First notification', { type: 'info', title: 'First' })
                setTimeout(() => showToast('Second notification', { type: 'success', title: 'Second' }), 500)
                setTimeout(() => showToast('Third notification', { type: 'warning', title: 'Third' }), 1000)
              }}
            >
              Show Multiple
            </Btn>
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Interactive Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Button Interactions</h3>
            <div className="flex items-center gap-4">
              <Btn onClick={() => showToast('Button clicked!', { type: 'info', title: 'Button Action' })}>Click me!</Btn>
              <Btn onClick={() => showToast('Form submitted!', { type: 'success', title: 'Form Submitted' })} type="submit">
                Submit Form
              </Btn>
              <Btn to="/settings" color="bg-blue-600">
                Navigate to Settings
              </Btn>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Icon Button Interactions</h3>
            <div className="flex items-center gap-4">
              <IconBtn icon="&#xe3c9;" onClick={() => showToast('Edit clicked!', { type: 'info', title: 'Icon Button Action' })} ariaLabel="Edit" />
              <IconBtn
                icon="&#xe5ca;"
                onClick={() => showToast('Close clicked!', { type: 'warning', title: 'Icon Button Action' })}
                ariaLabel="Close"
                bgColor="bg-red-500"
              />
              <IconBtn icon="&#xe3c9;" onClick={() => showToast('Close clicked!', { type: 'info', title: 'Icon Button Action' })} ariaLabel="Close" />
              <IconBtn
                icon="&#xe3c9;"
                onClick={() => showToast('Loading clicked!', { type: 'info', title: 'Icon Button Action' })}
                loading
                ariaLabel="Loading"
              />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Checkbox Interactions</h3>
            <div className="space-y-4">
              <Checkbox value={checkboxValue} onChange={setCheckboxValue} label="Accept terms and conditions" />
              <Checkbox value={checkboxValue2} onChange={setCheckboxValue2} label="Subscribe to newsletter" />
              <Checkbox value={checkboxValue3} onChange={setCheckboxValue3} label="Enable notifications" small />
            </div>
          </div>
        </div>
      </section>

      {/* Component Information */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Available Components</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">React Components</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">Btn.tsx</code> - Button component with various states (loading, disabled, small, link)
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">IconBtn.tsx</code> - Icon button component with material symbols, loading states, and
              customization options
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">Checkbox.tsx</code> - Checkbox component with different sizes and states
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">LoadingIndicator.tsx</code> - Loading spinner component with animated dots
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">LoadingSpinner.tsx</code> - Ball spin loading spinner with multiple sizes and themes
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">ContextMenuDropdown.tsx</code> - Context menu dropdown with submenus, loading states, and custom
              triggers
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">Dropdown.tsx</code> - Select dropdown component with labels, subtext, and various states
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">FileInput.tsx</code> - File input component with customizable accept types and responsive design
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">LibraryIcon.tsx</code> - Library icon component using absicons font with validation and fallback
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">MediaIconPicker.tsx</code> - Icon picker component for selecting library icons with dropdown menu
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">InputDropdown.tsx</code> - Input dropdown component that allows typing and filtering with optional
              new item creation
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">MultiSelectDropdown.tsx</code> - A multi-select component that uses a dropdown menu instead of a
              text input.
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">Toast.tsx</code> - Toast notification component with auto-dismiss, animations, and multiple types
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">ToastContainer.tsx</code> - Container component for managing multiple toast notifications
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">Modal.tsx</code> - Full-featured modal dialog component with portal rendering, animations, focus
              management, and customizable styling
            </li>
          </ul>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Usage Guidelines</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">React Components</h3>
          <div className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Btn Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import Btn from '@/components/ui/Btn'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">color</code>, <code className="bg-gray-700 px-2 py-1 rounded">small</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">loading</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">to</code> (for navigation)
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">IconBtn Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import IconBtn from '@/components/ui/IconBtn'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">icon</code>, <code className="bg-gray-700 px-2 py-1 rounded">bgColor</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">outlined</code>, <code className="bg-gray-700 px-2 py-1 rounded">borderless</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">loading</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">iconFontSize</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">ariaLabel</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Checkbox Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import Checkbox from '@/components/ui/Checkbox'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">small</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">medium</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">partial</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">LoadingIndicator Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import LoadingIndicator from '@/components/LoadingIndicator'</code>
              </p>
              <p className="mb-2">No props required - displays animated loading dots</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">LoadingSpinner Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import LoadingSpinner from '@/components/ui/LoadingSpinner'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">size</code> (la-sm, la-lg, la-2x, la-3x),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">dark</code>, <code className="bg-gray-700 px-2 py-1 rounded">color</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">className</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">ContextMenuDropdown Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">items</code> (ContextMenuItem[]),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">processing</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">iconClass</code>, <code className="bg-gray-700 px-2 py-1 rounded">menuWidth</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">onAction</code>, <code className="bg-gray-700 px-2 py-1 rounded">children</code> (ReactNode or
                function)
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Dropdown Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import Dropdown from '@/components/ui/Dropdown'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">items</code> (DropdownItem[]), <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">small</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">menuMaxHeight</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">FileInput Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import FileInput from '@/components/ui/FileInput'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">accept</code> (file types to accept),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">onChange</code> (callback with selected file),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">children</code> (ReactNode for button content),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">className</code> (custom CSS classes)
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">LibraryIcon Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import LibraryIcon from '@/components/ui/LibraryIcon'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">icon</code> (icon name from absicons, defaults to 'audiobookshelf'),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">fontSize</code> (CSS font size class, defaults to 'text-lg'),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">size</code> (5 or 6 for container size, defaults to 5),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">className</code> (additional CSS classes)
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">MediaIconPicker Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import MediaIconPicker from '@/components/ui/MediaIconPicker'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">value</code> (selected icon name, defaults to 'database'),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">onChange</code> (callback when icon is selected),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">label</code> (label text, defaults to 'Icon'),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">disabled</code> (disables the picker),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">className</code> (additional CSS classes),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">align</code> (menu alignment, defaults to 'left', options: 'left', 'right', 'center')
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">InputDropdown Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import InputDropdown from '@/components/ui/InputDropdown'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">items</code> (string[] or number[]),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">editable</code>, <code className="bg-gray-700 px-2 py-1 rounded">showAllWhenEmpty</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">onNewItem</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">MultiSelectDropdown Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">items</code> (MultiSelectItem[]), <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Toast Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import Toast from '@/components/widgets/Toast'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">id</code>, <code className="bg-gray-700 px-2 py-1 rounded">type</code> (success, error,
                warning, info), <code className="bg-gray-700 px-2 py-1 rounded">title</code>, <code className="bg-gray-700 px-2 py-1 rounded">message</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">duration</code>, <code className="bg-gray-700 px-2 py-1 rounded">onClose</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">ToastContainer Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import ToastContainer from '@/components/widgets/ToastContainer'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">toasts</code> (ToastMessage[]),{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">onRemove</code>
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Global Toast Hook</h4>
              <p className="mb-2">
                Import:{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  import {'{'} useGlobalToast {'}'} from '@/contexts/ToastContext'
                </code>
              </p>
              <p className="mb-2">
                Returns: <code className="bg-gray-700 px-2 py-1 rounded">toasts</code>, <code className="bg-gray-700 px-2 py-1 rounded">showToast</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">removeToast</code>
              </p>
              <p className="mb-2">
                Usage:{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  showToast(message, {'{'} type, title, duration {'}'})
                </code>
              </p>
              <p className="mb-2 text-sm text-gray-400">
                Note: Global toast is automatically available in all pages. No need to include ToastContainer manually.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Modal Component</h4>
              <p className="mb-2">
                Import: <code className="bg-gray-700 px-2 py-1 rounded">import Modal from '@/components/modals/Modal'</code>
              </p>
              <p className="mb-2">
                Props: <code className="bg-gray-700 px-2 py-1 rounded">isOpen</code>, <code className="bg-gray-700 px-2 py-1 rounded">onClose</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">children</code>, <code className="bg-gray-700 px-2 py-1 rounded">processing</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">persistent</code>, <code className="bg-gray-700 px-2 py-1 rounded">width</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">height</code>, <code className="bg-gray-700 px-2 py-1 rounded">zIndexClass</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">bgOpacityClass</code>, <code className="bg-gray-700 px-2 py-1 rounded">contentMarginTop</code>,{' '}
                <code className="bg-gray-700 px-2 py-1 rounded">outerContent</code>
              </p>
              <p className="mb-2 text-sm text-gray-400">
                Features: portal rendering, smooth animations, focus management, keyboard navigation (Escape), backdrop click to close, processing overlay,
                persistent mode, customizable dimensions and styling
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
