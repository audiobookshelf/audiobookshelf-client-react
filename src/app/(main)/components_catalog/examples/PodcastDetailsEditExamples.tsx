'use client'

import Btn from '@/components/ui/Btn'
import PodcastDetailsEdit, { PodcastDetailsEditRef, UpdatePayload } from '@/components/widgets/PodcastDetailsEdit'
import { PodcastLibraryItem } from '@/types/api'
import { useCallback, useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

const mockLibraryItem: PodcastLibraryItem = {
  id: 'cltjyl123000108l437q67p8o',
  ino: '13631488-1679503385065',
  libraryId: 'cltjx6i95000008jp5e2p3j4c',
  folderId: 'cltjx6i95000008jp5e2p3j4c-root',
  path: '/data/podcasts/My Favorite Podcast',
  relPath: 'My Favorite Podcast',
  isFile: false,
  mtimeMs: 1679503385065,
  ctimeMs: 1679503385065,
  birthtimeMs: 1679503385065,
  addedAt: 1679503385065,
  updatedAt: 1679503385065,
  isMissing: false,
  isInvalid: false,
  mediaType: 'podcast',
  media: {
    id: 'cltjyl123000208l46y4d3g4h',
    libraryItemId: 'cltjyl123000108l437q67p8o',
    metadata: {
      title: 'My Favorite Podcast',
      author: 'Jane Doe',
      description: '<p>An amazing podcast about technology and culture.</p>',
      releaseDate: '2023-01-15',
      genres: ['Technology', 'Culture'],
      feedURL: 'https://example.com/feed.xml',
      itunesId: '123456789',
      language: 'English',
      explicit: false,
      podcastType: 'episodic'
    },
    coverPath: '/data/podcasts/My Favorite Podcast/cover.jpg',
    tags: ['Tech', 'Weekly'],
    episodes: []
  },
  libraryFiles: []
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

export function PodcastDetailsEditExamples() {
  const podcastDetailsEditRef = useRef<PodcastDetailsEditRef>(null)
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

      <Example title="Default">
        <PodcastDetailsEdit
          ref={podcastDetailsEditRef}
          libraryItem={libraryItem}
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
