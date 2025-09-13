'use client'
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'

// Toggle Button Examples

export function ToggleBtnsExamples() {
  const [selectedValue1, setSelectedValue1] = useState('option1')
  const [selectedValue2, setSelectedValue2] = useState('small')
  const [selectedValue3, setSelectedValue3] = useState('enabled')
  const [selectedValue4, setSelectedValue4] = useState('medium')
  const [selectedValue5, setSelectedValue5] = useState('large')

  const handleChange1 = (value: string | number) => setSelectedValue1(String(value))
  const handleChange2 = (value: string | number) => setSelectedValue2(String(value))
  const handleChange3 = (value: string | number) => setSelectedValue3(String(value))
  const handleChange4 = (value: string | number) => setSelectedValue4(String(value))
  const handleChange5 = (value: string | number) => setSelectedValue5(String(value))

  const basicItems = [
    { text: 'Option 1', value: 'option1' },
    { text: 'Option 2', value: 'option2' },
    { text: 'Option 3', value: 'option3' }
  ]

  const sizeItems = [
    { text: 'Small', value: 'small' },
    { text: 'Medium', value: 'medium' },
    { text: 'Large', value: 'large' }
  ]

  const stateItems = [
    { text: 'Enabled', value: 'enabled' },
    { text: 'Disabled', value: 'disabled' }
  ]

  return (
    <ComponentExamples title="Toggle Buttons">
      <ComponentInfo component="ToggleButtonGroup" description="Toggle button group component with radio button behavior and keyboard navigation">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">items</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">value</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic Toggle Buttons">
          <div className="space-y-4">
            <ToggleButtonGroup items={basicItems} value={selectedValue1} onChange={handleChange1} label="Select an option" />
          </div>
        </Example>

        <Example title="Different Sizes">
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <ToggleButtonGroup items={sizeItems} value={selectedValue2} onChange={handleChange2} size="small" label="Small" />
              </div>
              <div>
                <ToggleButtonGroup items={sizeItems} value={selectedValue4} onChange={handleChange4} size="medium" label="Medium" />
              </div>
              <div>
                <ToggleButtonGroup items={sizeItems} value={selectedValue5} onChange={handleChange5} size="large" label="Large" />
              </div>
            </div>
          </div>
        </Example>

        <Example title="Disabled State">
          <div className="space-y-4">
            <ToggleButtonGroup items={stateItems} value={selectedValue3} onChange={handleChange3} disabled={true} label="Select state" />
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
