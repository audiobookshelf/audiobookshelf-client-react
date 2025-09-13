'use client'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'

// TextInput Examples
export function TextInputExamples() {
  const [textValue1, setTextValue1] = useState('Hello World')
  const [textValue2, setTextValue2] = useState('')
  const [textValue3, setTextValue3] = useState('password123')
  const [textValue4, setTextValue4] = useState('2024-01-15T10:30')
  const [textValue5, setTextValue5] = useState('Copy this text')
  const [textValue6, setTextValue6] = useState('Clear me')
  const [textValue7, setTextValue7] = useState('Centered text')
  const [textValue8, setTextValue8] = useState('42')

  const { showToast } = useGlobalToast()

  const handleClear = () => {
    showToast('Text cleared!', { type: 'info', title: 'Clear Action' })
  }

  return (
    <ComponentExamples title="Text Inputs">
      <ComponentInfo
        component="TextInput"
        description="Accessible text input with password visibility toggle, copy to clipboard, clear button, and various styling options"
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <code className="bg-gray-700 px-2 py-1 rounded">import TextInput from '@/components/ui/TextInput'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>, <code className="bg-gray-700 px-2 py-1 rounded">label</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">placeholder</code>, <code className="bg-gray-700 px-2 py-1 rounded">type</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">readOnly</code>, <code className="bg-gray-700 px-2 py-1 rounded">disabled</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">clearable</code>, <code className="bg-gray-700 px-2 py-1 rounded">showCopy</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">customInputClass</code>, <code className="bg-gray-700 px-2 py-1 rounded">step</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">min</code>, <code className="bg-gray-700 px-2 py-1 rounded">onClear</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onFocus</code>, <code className="bg-gray-700 px-2 py-1 rounded">onBlur</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">id</code>, <code className="bg-gray-700 px-2 py-1 rounded">name</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code>, <code className="bg-gray-700 px-2 py-1 rounded">ref</code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Text Input">
          <TextInput label="Name" value={textValue1} onChange={setTextValue1} placeholder="Enter your name" />
        </Example>

        <Example title="Text Input with Label">
          <TextInput label="Email" value={textValue2} onChange={setTextValue2} placeholder="Enter your email" />
        </Example>

        <Example title="Password Input">
          <TextInput label="Password" value={textValue3} onChange={setTextValue3} type="password" placeholder="Enter password" />
        </Example>

        <Example title="Date Time Input">
          <TextInput label="Date & Time" value={textValue4} onChange={setTextValue4} type="datetime-local" />
        </Example>

        <Example title="Number Input">
          <TextInput label="Age" value={textValue8} onChange={setTextValue8} type="number" min="0" step="1" />
        </Example>

        <Example title="Number Input (No Spinner)">
          <TextInput label="Age" value={textValue8} onChange={setTextValue8} type="number" min="0" step="1" customInputClass="no-spinner" />
        </Example>

        <Example title="Copy to Clipboard">
          <TextInput label="Copy Text" value={textValue5} onChange={setTextValue5} showCopy />
        </Example>

        <Example title="Clearable Input">
          <TextInput label="Clearable" value={textValue6} onChange={setTextValue6} clearable onClear={handleClear} />
        </Example>

        <Example title="Centered Text">
          <TextInput label="Centered" value={textValue7} onChange={setTextValue7} customInputClass="text-center" />
        </Example>

        <Example title="Read-only Input">
          <TextInput label="Read-only" value="This is read-only content" readOnly />
        </Example>

        <Example title="Disabled Input">
          <TextInput label="Disabled" value="This input is disabled" disabled />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
