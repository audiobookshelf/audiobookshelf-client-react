'use client'

import Files from '@/components/widgets/Files'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface FilesExamplesProps {
  selectedBook?: BookLibraryItem | null
  selectedPodcast?: PodcastLibraryItem | null
}

export function FilesExamples({ selectedBook, selectedPodcast }: FilesExamplesProps) {
  const { user } = useComponentsCatalog()
  const selectedLibraryItem = selectedBook || selectedPodcast

  return (
    <ComponentExamples title="Files">
      <ComponentInfo component="Files" description="Files tab container component that displays library files table for a library item.">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Files from &apos;@/components/widgets/Files&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The library item (BookLibraryItem or PodcastLibraryItem).
            </li>
            <li>
              <Code>user</Code>: The current user object.
            </li>
          </ul>
        </div>
      </ComponentInfo>

      {selectedLibraryItem ? (
        <Example title={`Files for: ${selectedLibraryItem.media.metadata.title}`} className="mb-6">
          <Files libraryItem={selectedLibraryItem} user={user} />
        </Example>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
          <p className="text-gray-400">Select a book or podcast from the search box above to see the Files component with real data.</p>
        </div>
      )}
    </ComponentExamples>
  )
}
