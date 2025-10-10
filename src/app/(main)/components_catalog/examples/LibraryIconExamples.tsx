'use client'
import LibraryIcon from '@/components/ui/LibraryIcon'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// LibraryIcon Examples
export function LibraryIconExamples() {
  return (
    <ComponentExamples title="Library Icons">
      <ComponentInfo component="LibraryIcon" description="Library icon component using absicons font with validation and fallback">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import LibraryIcon from &apos;@/components/ui/LibraryIcon&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>icon</Code> (icon name from absicons, defaults to &apos;audiobookshelf&apos;), <Code>fontSize</Code>{' '}
          (CSS font size class, defaults to &apos;text-lg&apos;), <Code>size</Code> (5 or 6 for container size, defaults to 5), <Code>className</Code>{' '}
          (additional CSS classes)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Library Icon">
          <div className="p-2 rounded-lg">
            <LibraryIcon />
          </div>
        </Example>

        <Example title="Large Size">
          <div className="p-2 rounded-lg">
            <LibraryIcon size={6} />
          </div>
        </Example>

        <Example title="Custom Icon">
          <LibraryIcon icon="books-1" />
        </Example>

        <Example title="Custom Font Size">
          <LibraryIcon fontSize="text-3xl" />
        </Example>

        <Example title="Custom Icon with Large Size">
          <LibraryIcon icon="headphones" size={6} fontSize="text-3xl" />
        </Example>

        <Example title="Invalid Icon (Falls Back to Default)">
          <LibraryIcon icon="invalid-icon" />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
