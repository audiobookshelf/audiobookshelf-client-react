'use client'
import Checkbox from '@/components/ui/Checkbox'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// Checkbox Examples
export function CheckboxExamples() {
  const [checkboxValue1, setCheckboxValue1] = useState(false)
  const [checkboxValue2, setCheckboxValue2] = useState(true)
  const [checkboxValue3, setCheckboxValue3] = useState(false)
  const [checkboxValue4, setCheckboxValue4] = useState(false)
  const [checkboxValue5, setCheckboxValue5] = useState(false)

  return (
    <ComponentExamples title="Checkboxes">
      <ComponentInfo component="Checkbox" description="Checkbox component with different sizes and states">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Checkbox from &apos;@/components/ui/Checkbox&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>value</Code>, <Code>onChange</Code>, <Code>label</Code>, <Code>small</Code>, <Code>medium</Code>,{' '}
          <Code>disabled</Code>, <Code>partial</Code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Checkbox">
          <Checkbox value={checkboxValue1} onChange={setCheckboxValue1} label="Accept terms and conditions" className="w-fit" />
        </Example>

        <Example title="Checked Checkbox">
          <Checkbox value={checkboxValue2} onChange={setCheckboxValue2} label="Subscribe to newsletter" className="w-fit" />
        </Example>

        <Example title="Small Checkbox">
          <Checkbox value={checkboxValue3} onChange={setCheckboxValue3} label="Enable notifications" size="small" className="w-fit" />
        </Example>

        <Example title="Large Checkbox">
          <Checkbox value={checkboxValue4} onChange={setCheckboxValue4} label="Large size checkbox" size="large" className="w-fit" />
        </Example>

        <Example title="Disabled Checkbox">
          <Checkbox value={false} label="Disabled checkbox" disabled className="w-fit" />
        </Example>

        <Example title="Disabled Checked Checkbox">
          <Checkbox value={true} label="Disabled checked checkbox" disabled className="w-fit" />
        </Example>

        <Example title="Partial Checkbox">
          <Checkbox value={false} label="Partial state checkbox" partial className="w-fit" />
        </Example>

        <Example title="Unlabeled Checkbox">
          <Checkbox value={checkboxValue5} onChange={setCheckboxValue5} className="w-fit" />
        </Example>

        <Example title="Unlabeled Disabled Checkbox">
          <Checkbox value={false} disabled className="w-fit" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
