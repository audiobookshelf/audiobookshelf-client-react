'use client'

import Btn from '@/components/ui/Btn'
import BookDetailsEdit, { BookDetailsEditRef } from '@/components/widgets/BookDetailsEdit'
import { BookLibraryItem } from '@/types/api'
import { useRef, useState } from 'react'
import { ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

const mockLibraryItem: BookLibraryItem = {
  id: 'cltjyl123000108l437q67p8o',
  ino: '13631488-1679503385065',
  libraryId: 'cltjx6i95000008jp5e2p3j4c',
  folderId: 'cltjx6i95000008jp5e2p3j4c-root',
  path: '/data/audiobooks/The Lord of the Rings',
  relPath: 'The Lord of the Rings',
  isFile: false,
  mtimeMs: 1679503385065,
  ctimeMs: 1679503385065,
  birthtimeMs: 1679503385065,
  addedAt: 1679503385065,
  updatedAt: 1679503385065,
  isMissing: false,
  isInvalid: false,
  mediaType: 'book',
  media: {
    id: 'cltjyl123000208l46y4d3g4h',
    libraryItemId: 'cltjyl123000108l437q67p8o',
    metadata: {
      title: 'The Lord of the Rings',
      subtitle: 'The Complete Saga',
      authors: [{ id: 'author-1', name: 'J.R.R. Tolkien' }],
      narrators: ['Rob Inglis'],
      series: [{ id: 'series-1', name: 'The Lord of the Rings', sequence: '1' }],
      genres: ['Fantasy', 'Adventure'],
      publishedYear: '1954',
      publisher: 'Allen & Unwin',
      description: '<p>A fantastic journey to destroy a powerful ring.</p>',
      isbn: '978-0-618-64015-7',
      asin: 'B007978N6Q',
      language: 'English',
      explicit: false,
      abridged: false
    },
    coverPath: '/data/audiobooks/The Lord of the Rings/cover.jpg',
    tags: ['Classic', 'Epic'],
    audioFiles: [],
    chapters: [],
    duration: 3600
  },
  libraryFiles: []
}

const mockAuthors = [
  { value: 'author-1', content: 'J.R.R. Tolkien' },
  { value: 'author-2', content: 'George R.R. Martin' }
]
const mockNarrators = [
  { value: 'Rob Inglis', content: 'Rob Inglis' },
  { value: 'Roy Dotrice', content: 'Roy Dotrice' }
]
const mockGenres = [
  { value: 'Fantasy', content: 'Fantasy' },
  { value: 'Adventure', content: 'Adventure' },
  { value: 'Sci-Fi', content: 'Sci-Fi' }
]
const mockTags = [
  { value: 'Classic', content: 'Classic' },
  { value: 'Epic', content: 'Epic' }
]
const mockSeries = [
  { value: 'series-1', content: 'The Lord of the Rings' },
  { value: 'series-2', content: 'A Song of Ice and Fire' }
]

export function BookDetailsEditExamples() {
  const bookDetailsEditRef = useRef<BookDetailsEditRef>(null)
  const [libraryItem, setLibraryItem] = useState(mockLibraryItem)
  const [hasChanges, setHasChanges] = useState(false)

  return (
    <ComponentExamples title="Book Details Edit">
      <ComponentInfo
        component="BookDetailsEdit"
        description="A form for editing the metadata of a book library item. It includes fields for title, author, series, and more."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import BookDetailsEdit from &apos;@/components/widgets/BookDetailsEdit&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">libraryItem</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">authors</code>, <code className="bg-gray-700 px-2 py-1 rounded">narrators</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">genres</code>, <code className="bg-gray-700 px-2 py-1 rounded">tags</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">series</code>, <code className="bg-gray-700 px-2 py-1 rounded">onChange</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onSubmit</code>
        </p>
      </ComponentInfo>

      <Example title="Default">
        <BookDetailsEdit
          ref={bookDetailsEditRef}
          libraryItem={libraryItem}
          availableAuthors={mockAuthors}
          availableNarrators={mockNarrators}
          availableGenres={mockGenres}
          availableTags={mockTags}
          availableSeries={mockSeries}
          onChange={(details) => setHasChanges(details.hasChanges)}
          onSubmit={(details) => {
            console.log('onSubmit', details)
            if (details.hasChanges) {
              setLibraryItem((prev) => ({
                ...prev,
                media: {
                  ...prev.media,
                  metadata: {
                    ...prev.media.metadata,
                    ...details.updatePayload.metadata
                  },
                  tags: details.updatePayload.tags ?? prev.media.tags
                }
              }))
              setHasChanges(false)
            }
          }}
        />
        <div className="flex justify-end px-2 md:px-4">
          <Btn onClick={() => bookDetailsEditRef.current?.submit()} disabled={!hasChanges}>
            Save
          </Btn>
        </div>
      </Example>
    </ComponentExamples>
  )
}
