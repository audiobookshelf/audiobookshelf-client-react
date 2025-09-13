import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'
import { useState } from 'react'
import RangeInput from '@/components/ui/RangeInput'

export function RangeInputExamples() {
  // RangeInput sample data
  const [rangeValue1, setRangeValue1] = useState(50)
  const [rangeValue2, setRangeValue2] = useState(25)
  const [rangeValue3, setRangeValue3] = useState(75)
  const [rangeValue4, setRangeValue4] = useState(0)
  const [rangeValue5, setRangeValue5] = useState(100)

  return (
    <ComponentExamples title="Range Inputs">
      <ComponentInfo component="RangeInput" description="Accessible range input component with customizable min/max/step values, labels, and disabled state">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import RangeInput from '@/components/ui/RangeInput'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">min</code>, <code className="bg-gray-700 px-2 py-1 rounded">max</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">step</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>, <code className="bg-gray-700 px-2 py-1 rounded">aria-describedby</code>
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
