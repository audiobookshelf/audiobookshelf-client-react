'use client'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'

// Toggle Switch Examples

export function ToggleSwitchExamples() {
  const [toggle1, setToggle1] = useState(false)
  const [toggle2, setToggle2] = useState(true)
  const [toggle3, setToggle3] = useState(false)
  const [toggle4, setToggle4] = useState(false)
  const [toggle5, setToggle5] = useState(false)
  const [toggle6, setToggle6] = useState(false)
  const [toggle7, setToggle7] = useState(false)
  const [toggle8, setToggle8] = useState(false)

  return (
    <ComponentExamples title="Toggle Switches">
      <ComponentInfo component="ToggleSwitch" description="Toggle switch component with various sizes, colors, and states">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import ToggleSwitch from '@/components/ui/ToggleSwitch'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code>, <code className="bg-gray-700 px-2 py-1 rounded">onColor</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">offColor</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">ariaLabel</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Basic Toggle Switch">
          <div className="space-y-4">
            <ToggleSwitch value={toggle1} onChange={setToggle1} label="Basic toggle" className="w-fit" />
            <div className="text-sm text-gray-400">Current value: {toggle1 ? 'On' : 'Off'}</div>
          </div>
        </Example>

        <Example title="Different Sizes">
          <div className="space-y-4">
            <ToggleSwitch size="small" value={toggle2} onChange={setToggle2} label="Small toggle" className="w-fit" />
            <ToggleSwitch size="medium" value={toggle3} onChange={setToggle3} label="Medium toggle" className="w-fit" />
            <ToggleSwitch size="large" value={toggle4} onChange={setToggle4} label="Large toggle" className="w-fit" />
          </div>
        </Example>

        <Example title="Color Variants">
          <div className="space-y-4">
            <ToggleSwitch onColor="success" offColor="error" value={toggle5} onChange={setToggle5} label="Success/Error" className="w-fit" />
            <ToggleSwitch onColor="warning" offColor="primary" value={toggle6} onChange={setToggle6} label="Warning/Primary" className="w-fit" />
            <ToggleSwitch onColor="primary" offColor="error" value={toggle7} onChange={setToggle7} label="Primary/Error" className="w-fit" />
          </div>
        </Example>

        <Example title="Disabled State">
          <div className="space-y-4">
            <ToggleSwitch disabled value={true} label="Disabled (On)" className="w-fit" />
            <ToggleSwitch disabled value={false} label="Disabled (Off)" className="w-fit" />
          </div>
        </Example>

        <Example title="Without Label">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <ToggleSwitch value={toggle8} onChange={setToggle8} ariaLabel="Unlabeled toggle" className="w-fit" />
            </div>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
