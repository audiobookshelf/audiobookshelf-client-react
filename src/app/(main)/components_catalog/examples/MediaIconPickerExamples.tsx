'use client'
import MediaIconPicker from '@/components/ui/MediaIconPicker'
import { useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// MediaIconPicker Examples

export function MediaIconPickerExamples() {
  const [mediaIconValue, setMediaIconValue] = useState('audiobookshelf')

  return (
    <ComponentExamples title="Media Icon Pickers">
      <ComponentInfo component="MediaIconPicker" description="Icon picker component for selecting library icons with dropdown menu">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import MediaIconPicker from &apos;@/components/ui/MediaIconPicker&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>value</Code> (selected icon name, defaults to &apos;database&apos;), <Code>onChange</Code> (callback
          when icon is selected), <Code>label</Code> (label text, defaults to &apos;Icon&apos;), <Code>disabled</Code> (disables the picker),{' '}
          <Code>className</Code> (additional CSS classes), <Code>align</Code> (menu alignment, defaults to &apos;left&apos;, options: &apos;left&apos;,
          &apos;right&apos;, &apos;center&apos;)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Media Icon Picker">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} />
        </Example>

        <Example title="Custom Label & Value">
          <MediaIconPicker value="books-1" onChange={setMediaIconValue} label="Choose Books Icon" />
        </Example>

        <Example title="Disabled State">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} label="Disabled Picker" disabled />
        </Example>

        <Example title="Menu Alignment (Right)">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} align="right" />
        </Example>

        <Example title="Menu Alignment (Center)">
          <MediaIconPicker value={mediaIconValue} onChange={setMediaIconValue} align="center" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
