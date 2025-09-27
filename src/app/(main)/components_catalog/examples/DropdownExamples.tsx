'use client'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// Dropdown Examples
export function DropdownExamples() {
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

  return (
    <ComponentExamples title="Dropdowns">
      <ComponentInfo component="Dropdown" description="Select dropdown component with labels, subtext, and various states">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import Dropdown from &apos;@/components/ui/Dropdown&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">items</code> (DropdownItem[]),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">label</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">menuMaxHeight</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Select Option" />
        </Example>

        <Example title="Dropdown with Subtext">
          <Dropdown value={dropdownValue2} onChange={handleDropdownChange2} items={dropdownItemsWithSubtext} label="Language" />
        </Example>

        <Example title="Disabled Dropdown">
          <Dropdown value="option1" items={dropdownItems} label="Disabled Option" disabled />
        </Example>

        <Example title="Large Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Large Option" size="large" />
        </Example>

        <Example title="Small Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Small Option" size="small" />
        </Example>

        <Example title="Custom Menu Height Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Custom Height" menuMaxHeight="100px" />
        </Example>

        <Example title="Unlabeled Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
