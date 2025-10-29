'use client'

import CoverEdit from '@/components/widgets/CoverEdit'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface CoverEditExamplesProps {
  selectedLibraryItem?: BookLibraryItem | PodcastLibraryItem
}

export function CoverEditExamples({ selectedLibraryItem }: CoverEditExamplesProps) {
  const { user, bookCoverAspectRatio } = useComponentsCatalog()
  return (
    <ComponentExamples title="Cover Edit">
      <ComponentInfo
        component="CoverEdit"
        description="A comprehensive cover management component for library items. Supports uploading covers, searching from multiple providers, managing local covers, and cover URL submission. Cover providers are automatically loaded from the global MetadataContext based on the media type. Processing state is managed internally using React transitions."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import CoverEdit from &apos;@/components/widgets/CoverEdit&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The library item to manage covers for.
            </li>
            <li>
              <Code>user</Code>: Current user with permissions.
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Aspect ratio for book covers.
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <Example title={`Cover Edit for: ${selectedLibraryItem?.media.metadata.title}`}>
        {/* Cover Component Display */}
        {selectedLibraryItem ? (
          <div style={{ height: '600px' }}>
            <CoverEdit libraryItem={selectedLibraryItem} user={user} bookCoverAspectRatio={bookCoverAspectRatio} />
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-primary/20 rounded-lg">
            <p className="text-gray-400 mb-2">No book selected</p>
            <p className="text-sm text-gray-500">Use the search box above to select a book and see the Cover component in action with real data</p>
          </div>
        )}
      </Example>
    </ComponentExamples>
  )
}
