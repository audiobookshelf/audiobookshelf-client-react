'use client'
import InputDropdown from '@/components/ui/InputDropdown'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'

// InputDropdown Examples
export function InputDropdownExamples() {
  const { showToast } = useGlobalToast()

  // InputDropdown sample data
  const inputDropdownItems = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']
  const [inputDropdownValue, setInputDropdownValue] = useState('')
  const [inputDropdownValue2, setInputDropdownValue2] = useState('')
  const [inputDropdownValue3, setInputDropdownValue3] = useState('')

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

  return (
    <ComponentExamples title="Input Dropdowns">
      <ComponentInfo component="InputDropdown" description="Input dropdown component that allows typing and filtering with optional new item creation">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import InputDropdown from '@/components/ui/InputDropdown'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">items</code> (string[] or number[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">editable</code>, <code className="bg-gray-700 px-2 py-1 rounded">showAllWhenEmpty</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onNewItem</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Input Dropdown">
          <InputDropdown value={inputDropdownValue} onChange={handleInputDropdownChange} items={inputDropdownItems} label="Select Fruit" />
        </Example>

        <Example title="Input Dropdown with New Item Creation">
          <InputDropdown
            value={inputDropdownValue2}
            onChange={handleInputDropdownChange2}
            items={inputDropdownItems}
            label="Add or Select Fruit"
            onNewItem={handleInputDropdownNewItem}
          />
        </Example>

        <Example title="Show All When Empty">
          <InputDropdown
            value={inputDropdownValue3}
            onChange={handleInputDropdownChange3}
            items={inputDropdownItems}
            label="Fruit with Show All"
            showAllWhenEmpty
          />
        </Example>

        <Example title="Disabled Input Dropdown">
          <InputDropdown value="Apple" items={inputDropdownItems} label="Disabled Fruit" disabled />
        </Example>

        <Example title="Input Dropdown without Label">
          <InputDropdown value={inputDropdownValue} onChange={handleInputDropdownChange} items={inputDropdownItems} />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
