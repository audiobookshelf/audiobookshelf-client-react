'use client'
import LibraryIcon from '@/components/ui/LibraryIcon'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'

// LibraryIcon Examples
export function LibraryIconExamples() {
  return (
    <ComponentExamples title="Library Icons">
      <ComponentInfo component="LibraryIcon" description="Library icon component using absicons font with validation and fallback">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import LibraryIcon from '@/components/ui/LibraryIcon'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">icon</code> (icon name from absicons, defaults to
          'audiobookshelf'), <code className="bg-gray-700 px-2 py-1 rounded">fontSize</code> (CSS font size class, defaults to 'text-lg'),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">size</code> (5 or 6 for container size, defaults to 5),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">className</code> (additional CSS classes)
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
