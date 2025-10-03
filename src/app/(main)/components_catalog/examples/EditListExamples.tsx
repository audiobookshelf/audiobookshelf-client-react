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
  let itemsWithIds = genreList
    .map((genre) => {
      return { id: genre, value: genre }
    })
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' }))

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
          <code className="bg-gray-700 px-2 py-1 rounded">libraryId (optional)</code>,
        </p>
        <p className="mb-2 text-sm text-gray-400">Features: Automatically shows extra column for number of books for pages that support that info</p>
      </ComponentInfo>
      <ExamplesBlock>
        <Example title="List Without Books Column" className="col-span-1 md:col-span-2 lg:col-span-3">
          <EditList
            items={itemsWithIds}
            // Emulate api call delay and return updated item
            onItemEditSaveClick={(itemToUpdate, newValue) => {
              return new Promise((res) =>
                setTimeout(() => {
                  showToast('2 items updated', { type: 'success', title: 'Success' })
                  // just an example, will not work correctly for multiple edits
                  itemsWithIds = itemsWithIds.filter((item) => item.id !== itemToUpdate.id)
                  res([...itemsWithIds, { id: newValue, value: newValue }].sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: 'base' })))
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
          ></EditList>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
