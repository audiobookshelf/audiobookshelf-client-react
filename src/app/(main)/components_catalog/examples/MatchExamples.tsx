'use client'

import Match from '@/components/widgets/Match'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface MatchExamplesProps {
  selectedLibraryItem?: BookLibraryItem | PodcastLibraryItem
  availableAuthors?: Array<{ value: string; content: string }>
  availableNarrators?: Array<{ value: string; content: string }>
  availableGenres?: Array<{ value: string; content: string }>
  availableTags?: Array<{ value: string; content: string }>
  availableSeries?: Array<{ value: string; content: string }>
}

export function MatchExamples({
  selectedLibraryItem,
  availableAuthors = [],
  availableNarrators = [],
  availableGenres = [],
  availableTags = [],
  availableSeries = []
}: MatchExamplesProps) {
  const { bookCoverAspectRatio } = useComponentsCatalog()
  return (
    <ComponentExamples title="Match">
      <ComponentInfo
        component="Match"
        description="A comprehensive metadata matching component for library items. Allows users to search for metadata matches using various providers, select a match, and apply selected fields to update the library item. Supports both books and podcasts with provider-specific search options. Search results are displayed as cards with cover previews, and selected matches can be customized field-by-field before applying."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Match from &apos;@/components/widgets/Match&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The library item to match metadata for (BookLibraryItem or PodcastLibraryItem).
            </li>
            <li>
              <Code>availableAuthors</Code>: Available authors for selection (optional).
            </li>
            <li>
              <Code>availableNarrators</Code>: Available narrators for selection (optional).
            </li>
            <li>
              <Code>availableGenres</Code>: Available genres for selection (optional).
            </li>
            <li>
              <Code>availableTags</Code>: Available tags for selection (optional).
            </li>
            <li>
              <Code>availableSeries</Code>: Available series for selection (optional).
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Aspect ratio for book covers.
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <Example title={`Match for: ${selectedLibraryItem?.media.metadata.title || 'No item selected'}`}>
        {/* Match Component Display */}
        {selectedLibraryItem ? (
          <div style={{ height: '600px' }}>
            <Match
              libraryItem={selectedLibraryItem}
              availableAuthors={availableAuthors}
              availableNarrators={availableNarrators}
              availableGenres={availableGenres}
              availableTags={availableTags}
              availableSeries={availableSeries}
              bookCoverAspectRatio={bookCoverAspectRatio}
            />
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-primary/20 rounded-lg">
            <p className="text-gray-400 mb-2">No library item selected</p>
            <p className="text-sm text-gray-500">Use the search box above to select a library item and see the Match component in action with real data</p>
          </div>
        )}
      </Example>
    </ComponentExamples>
  )
}
