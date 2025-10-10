import RangeInput from '@/components/ui/RangeInput'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function RangeInputExamples() {
  // RangeInput sample data
  const [rangeValue1, setRangeValue1] = useState(50)
  const [rangeValue2, setRangeValue2] = useState(25)
  const [rangeValue3, setRangeValue3] = useState(75)

  return (
    <ComponentExamples title="Range Inputs">
      <ComponentInfo component="RangeInput" description="Accessible range input component with customizable min/max/step values, labels, and disabled state">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import RangeInput from &apos;@/components/ui/RangeInput&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>value</Code>, <Code>onChange</Code>, <Code>label</Code>, <Code>min</Code>, <Code>max</Code>,{' '}
          <Code>step</Code>, <Code>disabled</Code>, <Code>className</Code>, <Code>aria-describedby</Code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: accessible with proper ARIA attributes, keyboard navigation, screen reader support, customizable styling, flexible layout (with/without
          label)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default RangeInput">
          <RangeInput value={rangeValue1} onChange={setRangeValue1} label="Volume Control" />
        </Example>

        <Example title="RangeInput without Label">
          <RangeInput value={rangeValue2} onChange={setRangeValue2} />
        </Example>

        <Example title="Custom Range (0-200)">
          <RangeInput value={rangeValue3} onChange={setRangeValue3} min={0} max={200} step={10} label="Custom Range With Step" />
        </Example>

        <Example title="Disabled RangeInput">
          <RangeInput value={50} onChange={() => {}} disabled label="Disabled Range" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
