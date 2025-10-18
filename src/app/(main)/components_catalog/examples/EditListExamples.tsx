'use client'

import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function EditListExamples() {
  const { showToast } = useGlobalToast()
  const genreList = [
    'Mystery',
    'Thriller & Suspense',
    'Anthologies & Short Stories',
    'Relationships, Parenting & Personal Development',
    'Gothic Fantasy/Horror',
    'Society & Culture:Places & Travel',
    'Places & Travel',
    'Education',
    'Comedy & Humor',
    'Science & Engineering',
    'Audio Theatre'
  ]

  // genres and tags don't have id's like narrators do
  const initialGenresWithIds = genreList
    .map((genre) => {
      return { id: genre, name: genre }
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const initialNarrators = [
    { id: 'Bob Ross', numBooks: 1, name: 'Bob Ross' },
    { id: 'Alejandro Ruiz', numBooks: 4, name: 'Alejandro Ruiz' },
    { id: 'William Dufris', numBooks: 2, name: 'William Dufris' },
    { id: 'Noah Michael Levine', numBooks: 1, name: 'Noah Michael Levine' },
    { id: 'Elizabeth Evans', numBooks: 17, name: 'Elizabeth Evans' }
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const [genresWithIds, setGenresWithIds] = useState(initialGenresWithIds)
  const [narrators, setNarrators] = useState(initialNarrators)

  return (
    <ComponentExamples title="Edit List">
      <ComponentInfo component="Edit List" description="Interactive list component for editing and deleting items">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import Edit List from &apos;@/components/ui/EditList&apos;</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">items</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onItemEditSaveClick</code>,<code className="bg-gray-700 px-2 py-1 rounded">onItemDeleteClick</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">listType</code>,<code className="bg-gray-700 px-2 py-1 rounded">libraryId (optional)</code>,
        </p>
        <p className="mb-2 text-sm text-gray-400">Features: Automatically shows extra column for number of books for pages that support that info</p>
      </ComponentInfo>
      <ExamplesBlock className="mb-4">
        <Example title="List Without Books Column" className="col-span-1 md:col-span-2 lg:col-span-3">
          <EditList
            items={genresWithIds}
            listType="Genre"
            // Emulate api call delay and return updated item
            onItemEditSaveClick={(genreToUpdate, newValue) => {
              return new Promise((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  setGenresWithIds((prev) =>
                    [...prev.filter((genre) => genre.id !== genreToUpdate.id), { id: newValue, name: newValue }].sort((a, b) =>
                      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                    )
                  )
                  res()
                }, 1000)
              )
            }}
            onItemDeleteClick={(genreToDelete) => {
              return new Promise<void>((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  setGenresWithIds((prev) => prev.filter((item) => item.id !== genreToDelete.id))
                  res()
                }, 1000)
              )
            }}
          ></EditList>
        </Example>
      </ExamplesBlock>
      <ExamplesBlock>
        <Example title="List Books Column" className="col-span-1 md:col-span-2 lg:col-span-3">
          <EditList
            items={narrators}
            libraryId="Some_Library"
            listType="Narrator"
            // Emulate api call delay and return updated item
            onItemEditSaveClick={(narrToUpdate, newValue) => {
              return new Promise((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  // just an example, will not work correctly for multiple edits
                  const narrsUpdated = narrators.filter((narr) => narr.id !== narrToUpdate.id)
                  setNarrators(
                    [...narrsUpdated, { id: newValue, numBooks: 3, name: newValue }].sort((a, b) =>
                      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
                    )
                  )
                  res()
                }, 1000)
              )
            }}
            onItemDeleteClick={(narrToDelete) => {
              return new Promise<void>((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  setNarrators((prev) => prev.filter((narr) => narr.id !== narrToDelete.id))
                  res()
                }, 1000)
              )
            }}
          ></EditList>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
