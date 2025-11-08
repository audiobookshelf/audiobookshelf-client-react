'use client'

import Tools from '@/components/widgets/Tools'
import { BookLibraryItem } from '@/types/api'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface ToolsExamplesProps {
  selectedBook?: BookLibraryItem | null
}

export function ToolsExamples({ selectedBook }: ToolsExamplesProps) {
  return (
    <ComponentExamples title="Tools">
      <ComponentInfo component="Tools" description="Component for managing audiobook tools like M4B creation and metadata embedding.">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Tools from &apos;@/components/widgets/Tools&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The book library item (BookLibraryItem).
            </li>
            <li>
              <Code>className</Code> (optional): Additional CSS classes.
            </li>
          </ul>
        </div>
        <div className="mt-2">
          <span className="font-bold">Features:</span>
          <ul className="list-disc list-inside">
            <li>Quick Embed button with real-time progress tracking</li>
            <li>M4B Maker tool access (links to management page)</li>
            <li>Queue status alerts</li>
            <li>Success notifications on completion</li>
          </ul>
        </div>
      </ComponentInfo>

      {selectedBook ? (
        <Example title={`Tools for: ${selectedBook.media.metadata.title}`} className="mb-6">
          <Tools libraryItem={selectedBook} />
        </Example>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
          <p className="text-gray-400">Select a book from the search box above to see the Tools component with real data.</p>
        </div>
      )}
    </ComponentExamples>
  )
}
