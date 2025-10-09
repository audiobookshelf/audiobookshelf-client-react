'use client'

import EditList from '@/components/ui/EditList'
import { useGlobalToast } from '@/contexts/ToastContext'
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
  const itemsWithIds = genreList
    .map((genre) => {
      return { id: genre, value: genre }
    })
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' }))

  const narrators = [
    { id: 'a', numBooks: 1, value: 'Bob Ross' },
    { id: 'b', numBooks: 4, value: 'Alejandro Ruiz' },
    { id: 'c', numBooks: 2, value: 'William Dufris' },
    { id: 'd', numBooks: 1, value: 'Noah Michael Levine' },
    { id: 'e', numBooks: 17, value: 'Elizabeth Evans' }
  ].sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' }))

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
          <code className="bg-gray-700 px-2 py-1 rounded">saveConfirmI18nKey</code>,<code className="bg-gray-700 px-2 py-1 rounded">deleteConfirmI18nKey</code>,{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">libraryId (optional)</code>,
        </p>
        <p className="mb-2 text-sm text-gray-400">Features: Automatically shows extra column for number of books for pages that support that info</p>
      </ComponentInfo>
      <ExamplesBlock className="mb-4">
        <Example title="List Without Books Column" className="col-span-1 md:col-span-2 lg:col-span-3">
          <EditList
            items={itemsWithIds}
            // Emulate api call delay and return updated item
            onItemEditSaveClick={(itemToUpdate, newValue) => {
              return new Promise((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  // just an example, will not work correctly for multiple edits
                  const itemsUpdated = itemsWithIds.filter((item) => item.id !== itemToUpdate.id)
                  res([...itemsUpdated, { id: newValue, value: newValue }].sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' })))
                }, 1000)
              )
            }}
            onItemDeleteClick={() => {
              return new Promise<void>((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  res()
                }, 1000)
              )
            }}
            saveConfirmI18nKey="MessageConfirmRenameGenre"
            deleteConfirmI18nKey="MessageConfirmRemoveGenre"
          ></EditList>
        </Example>
      </ExamplesBlock>
      <ExamplesBlock>
        <Example title="List Books Column" className="col-span-1 md:col-span-2 lg:col-span-3">
          <EditList
            items={narrators}
            libraryId="Some_Library"
            // Emulate api call delay and return updated item
            onItemEditSaveClick={(itemToUpdate, newValue) => {
              return new Promise((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  // just an example, will not work correctly for multiple edits
                  const narrsUpdated = narrators.filter((item) => item.id !== itemToUpdate.id)
                  res(
                    [...narrsUpdated, { id: newValue, numBooks: 3, value: newValue }].sort((a, b) =>
                      a.value.localeCompare(b.value, undefined, { sensitivity: 'base' })
                    )
                  )
                }, 1000)
              )
            }}
            onItemDeleteClick={() => {
              return new Promise<void>((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  res()
                }, 1000)
              )
            }}
            saveConfirmI18nKey="MessageConfirmRenameGenre"
            deleteConfirmI18nKey="MessageConfirmRemoveGenre"
          ></EditList>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
