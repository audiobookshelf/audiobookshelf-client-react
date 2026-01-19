'use client'

import Btn from '@/components/ui/Btn'
import BookDetailsEdit, { BookDetailsEditRef, BookUpdatePayload } from '@/components/widgets/BookDetailsEdit'
import { BookLibraryItem } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface BookDetailsEditExamplesProps {
  selectedBook?: BookLibraryItem | null
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

export function BookDetailsEditExamples({ selectedBook }: BookDetailsEditExamplesProps) {
  const bookDetailsEditRef = useRef<BookDetailsEditRef>(null)
  const [libraryItem, setLibraryItem] = useState(selectedBook)
  const [hasChanges, setHasChanges] = useState(false)

  // Update library item when selectedBook changes
  useEffect(() => {
    setLibraryItem(selectedBook)
  }, [selectedBook])

  const handleChange = useCallback((details: { libraryItemId: string; hasChanges: boolean }) => {
    setHasChanges(details.hasChanges)
  }, [])

  const handleSubmit = useCallback((details: { updatePayload: BookUpdatePayload; hasChanges: boolean }) => {
    if (details.hasChanges) {
      setLibraryItem((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          media: {
            ...prev.media,
            metadata: {
              ...prev.media.metadata,
              ...details.updatePayload.metadata
            },
            tags: details.updatePayload.tags ?? prev.media.tags
          }
        }
      })
      setHasChanges(false)
    }
  }, [])

  // Don't render if no book is selected
  if (!selectedBook) {
    return null
  }

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

      <Example title={`Book Details Edit for: ${libraryItem?.media.metadata.title}`}>
        <BookDetailsEdit
          ref={bookDetailsEditRef}
          libraryItem={libraryItem!}
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
