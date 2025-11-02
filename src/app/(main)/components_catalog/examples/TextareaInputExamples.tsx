'use client'
import TextareaInput from '@/components/ui/TextareaInput'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// TextareaInput Examples
export function TextareaInputExamples() {
  const [textValue1, setTextValue1] = useState('These are my notes.')
  const [textValue2, setTextValue2] = useState('Initial content')
  const [textValue3, setTextValue3] = useState('')
  const [textValue4] = useState('Read-only content.\nThis is a long text\nto test the textarea input.')

  return (
    <ComponentExamples title="Textarea Inputs">
      <ComponentInfo component="TextareaInput" description="Accessible textarea input with disabled and focus styles consistent with InputDropdown">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import TextareaInput from &apos;@/components/ui/TextareaInput&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>value</Code>, <Code>onChange</Code>, <Code>label</Code>, <Code>placeholder</Code>, <Code>rows</Code>,{' '}
          <Code>readOnly</Code>, <Code>disabled</Code>, <Code>className</Code>, <Code>id</Code>, <Code>fillHeight</Code>
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Textarea">
          <TextareaInput label="Notes" value={textValue1} onChange={setTextValue1} />
        </Example>

        <Example title="Read-only Textarea">
          <TextareaInput label="Read-only" value={textValue4} readOnly />
        </Example>

        <Example title="Disabled Textarea">
          <TextareaInput label="Disabled" value={'Disabled state. \nThis is a long text\nto test the textarea input.'} disabled />
        </Example>

        <Example title="Textarea with 4 Rows">
          <TextareaInput value={textValue2} onChange={setTextValue2} rows={4} />
        </Example>

        <Example title="Default Textarea with Placeholder">
          <TextareaInput value={textValue3} onChange={setTextValue3} placeholder="Type your text here..." />
        </Example>

        <Example title="Textarea with fillHeight (Full Height)">
          <div className="h-64">
            <TextareaInput value={textValue2} onChange={setTextValue2} placeholder="This textarea fills the available height..." fillHeight />
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
