'use client'
import DurationPicker from '@/components/ui/DurationPicker'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// DurationPicker Examples

export function DurationPickerExamples() {
  const [timeValue1, setTimeValue1] = useState(3661) // 1:01:01
  const [timeValue2, setTimeValue2] = useState(7200) // 2:00:00
  const [timeValue3, setTimeValue3] = useState(360000) // 100:00:00 (3-digit hours)

  return (
    <ComponentExamples title="Duration Picker">
      <ComponentInfo
        component="DurationPicker"
        description="Interactive duration input component with hours, minutes, and seconds. Supports keyboard navigation and 3-digit hours for long durations"
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import DurationPicker from &apos;@/components/ui/DurationPicker&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">onInput</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">showThreeDigitHour</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">readOnly</code>, <code className="bg-gray-700 px-2 py-1 rounded">borderless</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">className</code>
        </p>
        <p className="mb-2 text-sm text-gray-400">
          Features: click-to-focus individual digits, keyboard navigation (arrow keys, number input), visual focus indicators, support for 3-digit hours (over
          99 hours), click outside to blur, accessible with proper ARIA attributes
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default DurationPicker">
          <div className="space-y-2">
            <DurationPicker value={timeValue1} onChange={setTimeValue1} className="w-fit" />
            <p className="text-sm text-gray-400">
              Value: {timeValue1} seconds ({Math.floor(timeValue1 / 3600)}:{(Math.floor(timeValue1 / 60) % 60).toString().padStart(2, '0')}:
              {(timeValue1 % 60).toString().padStart(2, '0')})
            </p>
          </div>
        </Example>

        <Example title="DurationPicker with 3-Digit Hours">
          <div className="space-y-2">
            <DurationPicker value={timeValue3} onChange={setTimeValue3} showThreeDigitHour className="w-fit" />
            <p className="text-sm text-gray-400">
              Value: {timeValue3} seconds ({Math.floor(timeValue3 / 3600)}:{(Math.floor(timeValue3 / 60) % 60).toString().padStart(2, '0')}:
              {(timeValue3 % 60).toString().padStart(2, '0')})
            </p>
          </div>
        </Example>

        <Example title="Disabled DurationPicker">
          <DurationPicker value={timeValue2} onChange={() => {}} disabled className="w-fit" />
        </Example>

        <Example title="ReadOnly DurationPicker">
          <DurationPicker value={timeValue2} onChange={() => {}} readOnly className="w-fit" />
        </Example>

        <Example title="Borderless DurationPicker">
          <DurationPicker value={timeValue1} onChange={setTimeValue1} borderless className="w-fit" />
        </Example>

        <Example title="Small Size DurationPicker">
          <DurationPicker value={timeValue2} onChange={setTimeValue2} size="small" className="w-fit" />
        </Example>

        <Example title="Large Size DurationPicker">
          <DurationPicker value={timeValue2} onChange={setTimeValue2} size="large" className="w-fit" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
