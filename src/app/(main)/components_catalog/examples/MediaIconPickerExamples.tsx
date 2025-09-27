'use client'
import MediaIconPicker from '@/components/ui/MediaIconPicker'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// MediaIconPicker Examples

export function MediaIconPickerExamples() {
  const [mediaIconValue, setMediaIconValue] = useState('audiobookshelf')

  return (
    <ComponentExamples title="Media Icon Pickers">
      <ComponentInfo component="MediaIconPicker" description="Icon picker component for selecting library icons with dropdown menu">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import MediaIconPicker from &apos;@/components/ui/MediaIconPicker&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code> (selected icon name, defaults to
          &apos;database&apos;), <code className="bg-gray-700 px-2 py-1 rounded">onChange</code> (callback when icon is selected),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">label</code> (label text, defaults to &apos;Icon&apos;),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">disabled</code> (disables the picker),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code> (additional CSS classes),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">align</code> (menu alignment, defaults to &apos;left&apos;, options: &apos;left&apos;,
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
