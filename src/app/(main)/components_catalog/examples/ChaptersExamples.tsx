'use client'

import Chapters from '@/components/widgets/Chapters'
import { BookLibraryItem } from '@/types/api'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface ChaptersExamplesProps {
  selectedBook?: BookLibraryItem | null
}

// Mock book without chapters
const mockBookWithoutChapters: BookLibraryItem = {
  id: 'mock-book-no-chapters',
  ino: 'mock-ino',
  libraryId: 'mock-library',
  folderId: 'mock-folder',
  path: '/mock/path',
  relPath: 'mock/path',
  isFile: false,
  mtimeMs: Date.now(),
  ctimeMs: Date.now(),
  birthtimeMs: Date.now(),
  addedAt: Date.now(),
  updatedAt: Date.now(),
  isMissing: false,
  isInvalid: false,
  mediaType: 'book',
  media: {
    id: 'mock-media-id',
    libraryItemId: 'mock-book-no-chapters',
    metadata: {
      title: 'Book Without Chapters',
      subtitle: 'A Mock Example',
      authors: [],
      narrators: [],
      series: [],
      genres: [],
      explicit: false
    },
    coverPath: undefined,
    tags: [],
    audioFiles: [],
    chapters: [],
    duration: 0,
    size: 0
  },
  libraryFiles: [],
  size: 0,
  numFiles: 0
}

export function ChaptersExamples({ selectedBook }: ChaptersExamplesProps) {
  return (
    <ComponentExamples title="Chapters">
      <ComponentInfo component="Chapters" description="Component that displays chapters information including ID, title, start time, and duration.">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import Chapters from &apos;@/components/widgets/Chapters&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-inside list-disc">
            <li>
              <Code>libraryItem</Code>: The book library item with chapters (BookLibraryItem).
            </li>
          </ul>
        </div>
      </ComponentInfo>

      {selectedBook ? (
        <>
          <Example title={`Chapters for: ${selectedBook.media.metadata.title}`} className="mb-6">
            <Chapters libraryItem={selectedBook} />
          </Example>

          <Example title="Book Without Chapters (Mock Data)" className="mb-6">
            <Chapters libraryItem={mockBookWithoutChapters} />
          </Example>
        </>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-600 p-8">
          <p className="text-gray-400">Select a book from the search box above to see the Chapters components with real data.</p>
        </div>
      )}
    </ComponentExamples>
  )
}
