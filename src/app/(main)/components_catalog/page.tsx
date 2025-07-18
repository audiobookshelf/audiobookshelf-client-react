'use client'

import { useState } from 'react'
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
import { useGlobalToast } from '@/contexts/ToastContext'

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
              <code className="bg-gray-700 px-2 py-1 rounded">Toast.tsx</code> - Toast notification component with auto-dismiss, animations, and multiple types
            </li>
            <li>
              <code className="bg-gray-700 px-2 py-1 rounded">ToastContainer.tsx</code> - Container component for managing multiple toast notifications
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
          </div>
        </div>
      </section>
    </div>
  )
}
