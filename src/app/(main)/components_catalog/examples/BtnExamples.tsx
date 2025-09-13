'use client'
import Btn from '@/components/ui/Btn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'

// Button Examples
export function BtnExamples() {
  const { showToast } = useGlobalToast()
  const [progress, setProgress] = useState(0)

  // Progress cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <ComponentExamples title="Buttons">
      <ComponentInfo component="Btn" description="Button component with various states (loading, disabled, small, link)">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import Btn from '@/components/ui/Btn'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">color</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">small</code>, <code className="bg-gray-700 px-2 py-1 rounded">loading</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>, <code className="bg-gray-700 px-2 py-1 rounded">to</code> (for navigation)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Button">
          <Btn onClick={() => showToast('Default Button clicked', { type: 'info', title: 'Default Button' })}>Default Button</Btn>
        </Example>

        <Example title="Button with Span Content">
          <Btn onClick={() => showToast('Button with span content clicked', { type: 'info', title: 'Button with span content' })}>
            <span>Inside Span</span>
          </Btn>
        </Example>
        <Example title="Link Button">
          <Btn to="/settings">Go to Settings</Btn>
        </Example>

        <Example title="Small Button">
          <Btn size="small" onClick={() => showToast('Small Button clicked', { type: 'info', title: 'Small Button' })}>
            Small Button
          </Btn>
        </Example>

        <Example title="Disabled Button">
          <Btn disabled>Disabled Button</Btn>
        </Example>

        <Example title="Button with Progress">
          <Btn loading progress={`${progress}%`}>
            Uploading...
          </Btn>
        </Example>

        <Example title="Loading Button">
          <Btn loading>Loading...</Btn>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
