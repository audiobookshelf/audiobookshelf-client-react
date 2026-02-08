'use client'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

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

  const dropdownItemsWithDifferentLengths: DropdownItem[] = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2 with a longer text', value: 'option2' },
    { text: 'Option 3 with a longer text that is even longer', value: 'option3' }
  ]

  const dropdownItemsWithDifferentLengthsAndSubtext: DropdownItem[] = [
    { text: 'Option 1', value: 'option1', subtext: 'Subtext 1' },
    { text: 'Option 2 with a longer text', value: 'option2', subtext: 'Subtext 2' },
    { text: 'Option 3 with a longer text that is even longer', value: 'option3', subtext: 'Subtext 3' }
  ]

  const dropdownItemsWithSubmenus: DropdownItem[] = [
    { text: 'Option 1', value: 'option1' },
    {
      text: 'Option 2 (Submenu)',
      value: 'option2',
      subitems: [
        { text: 'Subitem 2.1', value: 'option2.1' },
        { text: 'Subitem 2.2', value: 'option2.2' },
        { text: 'Subitem 2.3', value: 'option2.3' }
      ]
    },
    {
      text: 'Option 3 (Submenu)',
      value: 'option3',
      subitems: [
        { text: 'Subitem 3.1', value: 'option3.1' },
        { text: 'Subitem 3.2', value: 'option3.2' }
      ]
    },
    { text: 'Option 4', value: 'option4' }
  ]

  const [dropdownValue, setDropdownValue] = useState('option1')
  const [dropdownValue2, setDropdownValue2] = useState('en')
  const [dropdownValue3, setDropdownValue3] = useState('option1')
  const [dropdownValue4, setDropdownValue4] = useState('option1')
  const [dropdownValue5, setDropdownValue5] = useState('option1')

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

  const handleDropdownChange4 = (value: string | number) => {
    setDropdownValue4(String(value))
  }

  const handleDropdownChange5 = (value: string | number) => {
    setDropdownValue5(String(value))
  }

  return (
    <ComponentExamples title="Dropdowns">
      <ComponentInfo component="Dropdown" description="Select dropdown component with labels, subtext, and various states">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Dropdown from &apos;@/components/ui/Dropdown&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>value</Code>, <Code>onChange</Code>, <Code>items</Code> (DropdownItem[]), <Code>label</Code>,{' '}
          <Code>disabled</Code>, <Code>small</Code>, <Code>menuMaxHeight</Code>, <Code>className</Code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Dropdown">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Select Option" />
        </Example>

        <Example title="Dropdown with portal">
          <Dropdown value={dropdownValue} onChange={handleDropdownChange} items={dropdownItems} label="Select Option" usePortal={true} />
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

        <Example title="Different item lengths">
          <Dropdown
            value={dropdownValue3}
            onChange={handleDropdownChange3}
            items={dropdownItemsWithDifferentLengths}
            label="Dropdown with different item lengths"
          />
        </Example>

        <Example title="Different item lengths and subtext">
          <Dropdown
            value={dropdownValue4}
            onChange={handleDropdownChange4}
            items={dropdownItemsWithDifferentLengthsAndSubtext}
            label="Dropdown with different item lengths and subtext"
          />
        </Example>
        <Example title="Dropdown with submenus">
          <Dropdown value={dropdownValue5} onChange={handleDropdownChange5} items={dropdownItemsWithSubmenus} label="Dropdown with submenus" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
