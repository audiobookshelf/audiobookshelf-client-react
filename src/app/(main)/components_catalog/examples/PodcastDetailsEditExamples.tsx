'use client'

import Btn from '@/components/ui/Btn'
import PodcastDetailsEdit, { PodcastDetailsEditRef, PodcastUpdatePayload } from '@/components/widgets/PodcastDetailsEdit'
import { PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface PodcastDetailsEditExamplesProps {
  selectedPodcast?: PodcastLibraryItem | null
}

const mockGenres = [
  { value: 'Technology', content: 'Technology' },
  { value: 'Culture', content: 'Culture' },
  { value: 'News', content: 'News' },
  { value: 'Comedy', content: 'Comedy' }
]
const mockTags = [
  { value: 'Tech', content: 'Tech' },
  { value: 'Weekly', content: 'Weekly' },
  { value: 'Daily', content: 'Daily' }
]

export function PodcastDetailsEditExamples({ selectedPodcast }: PodcastDetailsEditExamplesProps) {
  const podcastDetailsEditRef = useRef<PodcastDetailsEditRef>(null)
  const [libraryItem, setLibraryItem] = useState(selectedPodcast)
  const [hasChanges, setHasChanges] = useState(false)

  // Update library item when selectedPodcast changes
  useEffect(() => {
    setLibraryItem(selectedPodcast)
  }, [selectedPodcast])

  const handleChange = useCallback((details: { libraryItemId: string; hasChanges: boolean }) => {
    console.log('onChange', details)
    setHasChanges(details.hasChanges)
  }, [])

  const handleSubmit = useCallback((details: { updatePayload: PodcastUpdatePayload; hasChanges: boolean }) => {
    console.log('onSubmit', details)
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

  // Don't render if no podcast is selected
  if (!selectedPodcast) {
    return null
  }

  return (
    <ComponentExamples title="Podcast Details Edit">
      <ComponentInfo
        component="PodcastDetailsEdit"
        description="A form for editing the metadata of a podcast library item. It includes fields for title, author, RSS feed URL, description, and more."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import PodcastDetailsEdit from &apos;@/components/widgets/PodcastDetailsEdit&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The podcast library item to edit.
            </li>
            <li>
              <Code>availableGenres</Code>: A list of available genres.
            </li>
            <li>
              <Code>availableTags</Code>: A list of available tags.
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

      <Example title={`Podcast Details Edit for: ${libraryItem?.media.metadata.title}`}>
        <PodcastDetailsEdit
          ref={podcastDetailsEditRef}
          libraryItem={libraryItem!}
          availableGenres={mockGenres}
          availableTags={mockTags}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        <div className="flex justify-end px-2 md:px-4">
          <Btn onClick={() => podcastDetailsEditRef.current?.submit()} disabled={!hasChanges}>
            Save
          </Btn>
        </div>
      </Example>
    </ComponentExamples>
  )
}
