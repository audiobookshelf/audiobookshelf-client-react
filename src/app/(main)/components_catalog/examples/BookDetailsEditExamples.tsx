'use client'

import Btn from '@/components/ui/Btn'
import BookDetailsEdit, { BookDetailsEditRef, UpdatePayload } from '@/components/widgets/BookDetailsEdit'
import { BookLibraryItem } from '@/types/api'
import { useCallback, useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

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

  const handleChange = useCallback((details: { libraryItemId: string; hasChanges: boolean }) => {
    console.log('onChange', details)
    setHasChanges(details.hasChanges)
  }, [])

  const handleSubmit = useCallback((details: { updatePayload: UpdatePayload; hasChanges: boolean }) => {
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
  }, [])

  return (
    <ComponentExamples title="Book Details Edit">
      <ComponentInfo
        component="BookDetailsEdit"
        description="A form for editing the metadata of a book library item. It includes fields for title, author, series, and more."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import BookDetailsEdit from &apos;@/components/widgets/BookDetailsEdit&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The book library item to edit.
            </li>
            <li>
              <Code>availableAuthors</Code>: A list of available authors.
            </li>
            <li>
              <Code>availableNarrators</Code>: A list of available narrators.
            </li>
            <li>
              <Code>availableGenres</Code>: A list of available genres.
            </li>
            <li>
              <Code>availableTags</Code>: A list of available tags.
            </li>
            <li>
              <Code>availableSeries</Code>: A list of available series.
            </li>
            <li>
              <Code>onChange</Code>: Callback fired when form data changes.
            </li>
            <li>
              <Code>onSubmit</Code>: Callback fired when form is submitted.
            </li>
          </ul>
        </div>
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
          onChange={handleChange}
          onSubmit={handleSubmit}
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
