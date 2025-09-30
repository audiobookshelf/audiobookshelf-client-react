'use client'

import { DetailsEditRef, UpdatePayload, useDetailsEdit } from '@/hooks/useDetailsEdit'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import React, { useCallback, useMemo } from 'react'
import Checkbox from '../ui/Checkbox'
import Dropdown, { DropdownItem } from '../ui/Dropdown'
import MultiSelect, { MultiSelectItem } from '../ui/MultiSelect'
import SlateEditor from '../ui/SlateEditor'
import TextInput from '../ui/TextInput'

type Details = Omit<PodcastMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'imageURL' | 'itunesPageURL' | 'itunesArtistId'>

export type PodcastDetailsEditRef = DetailsEditRef<Details>

interface PodcastDetailsEditProps {
  libraryItem: PodcastLibraryItem
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  onChange?: (details: { libraryItemId: string; hasChanges: boolean }) => void
  onSubmit?: (details: { updatePayload: UpdatePayload<Details>; hasChanges: boolean }) => void
  ref?: React.Ref<PodcastDetailsEditRef>
}

const PodcastDetailsEdit = ({ libraryItem, availableGenres = [], availableTags = [], onChange, onSubmit, ref }: PodcastDetailsEditProps) => {
  const t = useTypeSafeTranslations()

  const media = useMemo(() => libraryItem.media || {}, [libraryItem.media])

  const batchAppendLogic = useCallback(
    (state: { details: Details }, detailsToUpdate: Partial<Details>) => ({
      ...state.details,
      genres: detailsToUpdate.genres ? [...new Set([...(state.details.genres || []), ...detailsToUpdate.genres])] : state.details.genres
    }),
    []
  )

  const extractAuthor = useCallback((details: Details) => {
    return details.author || ''
  }, [])

  const {
    details,
    tags,
    updateField: handleFieldUpdate,
    updateTags,
    submitForm,
    initialDetails
  } = useDetailsEdit<Details>({
    metadata: (media.metadata as Details) || {},
    tags: media.tags || [],
    libraryItemId: libraryItem.id,
    ref,
    extractAuthor,
    onChange,
    onSubmit,
    batchAppendLogic,
    useLooseEquality: true
  })

  const podcastTypeItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelEpisodic'), value: 'episodic' },
      { text: t('LabelSerial'), value: 'serial' }
    ],
    [t]
  )

  const handlePodcastTypeChange = useCallback(
    (value: string | number) => {
      handleFieldUpdate('podcastType')(String(value) as Details['podcastType'])
    },
    [handleFieldUpdate]
  )

  const genreItems = useMemo(() => (details.genres || []).map((g) => ({ value: g, content: g })), [details.genres])
  const handleAddGenre = useCallback(
    (item: MultiSelectItem<string>) => {
      handleFieldUpdate('genres')([...(details.genres || []), item.content])
    },
    [details.genres, handleFieldUpdate]
  )
  const handleRemoveGenre = useCallback(
    (item: MultiSelectItem<string>) => {
      handleFieldUpdate('genres')((details.genres || []).filter((g) => g !== item.value))
    },
    [details.genres, handleFieldUpdate]
  )

  const tagItems = useMemo(() => tags.map((t) => ({ value: t, content: t })), [tags])
  const handleAddTag = useCallback(
    (item: MultiSelectItem<string>) => {
      updateTags([...tags, item.content])
    },
    [tags, updateTags]
  )
  const handleRemoveTag = useCallback(
    (item: MultiSelectItem<string>) => {
      updateTags(tags.filter((t) => t !== item.value))
    },
    [tags, updateTags]
  )

  return (
    <div className="w-full h-full relative">
      <form
        className="w-full h-full px-2 md:px-4 py-6"
        onSubmit={(e) => {
          e.preventDefault()
          submitForm()
        }}
      >
        <div className="flex -mx-1">
          <div className="w-full md:w-1/2 px-1">
            <TextInput value={details.title || ''} onChange={handleFieldUpdate('title') as (value: string) => void} label={t('LabelTitle')} />
          </div>
          <div className="grow px-1 mt-2 md:mt-0">
            <TextInput value={details.author || ''} onChange={handleFieldUpdate('author') as (value: string) => void} label={t('LabelAuthor')} />
          </div>
        </div>

        <TextInput
          value={details.feedURL || ''}
          onChange={handleFieldUpdate('feedURL') as (value: string) => void}
          label={t('LabelRSSFeedURL')}
          className="mt-2"
        />

        <SlateEditor srcContent={initialDetails.description || ''} onUpdate={handleFieldUpdate('description')} label={t('LabelDescription')} className="mt-2" />

        <div className="flex mt-2 -mx-1">
          <div className="w-full md:w-1/2 px-1">
            <MultiSelect
              selectedItems={genreItems}
              onItemAdded={handleAddGenre}
              onItemRemoved={handleRemoveGenre}
              label={t('LabelGenres')}
              items={availableGenres}
              allowNew
            />
          </div>
          <div className="grow px-1 mt-2 md:mt-0">
            <MultiSelect
              selectedItems={tagItems}
              onItemAdded={handleAddTag}
              onItemRemoved={handleRemoveTag}
              label={t('LabelTags')}
              items={availableTags}
              allowNew
            />
          </div>
        </div>

        <div className="flex mt-2 -mx-1">
          <div className="w-full md:w-1/4 px-1">
            <TextInput value={details.releaseDate || ''} onChange={handleFieldUpdate('releaseDate') as (value: string) => void} label={t('LabelReleaseDate')} />
          </div>
          <div className="w-full md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={details.itunesId || ''} onChange={handleFieldUpdate('itunesId') as (value: string | number) => void} label="iTunes ID" />
          </div>
          <div className="w-full md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={details.language || ''} onChange={handleFieldUpdate('language') as (value: string) => void} label={t('LabelLanguage')} />
          </div>
          <div className="grow px-1 pt-6 mt-2 md:mt-0">
            <div className="flex justify-center">
              <Checkbox
                value={details.explicit}
                onChange={handleFieldUpdate('explicit')}
                label={t('LabelExplicit')}
                checkboxBgClass="bg-primary"
                borderColorClass="border-gray-600"
                labelClass="ps-2 text-base font-semibold"
              />
            </div>
          </div>
        </div>
        <div className="flex mt-2 -mx-1">
          <div className="w-full md:w-1/4 px-1">
            <Dropdown
              label={t('LabelPodcastType')}
              value={details.podcastType || 'episodic'}
              items={podcastTypeItems}
              onChange={handlePodcastTypeChange}
              className="max-w-52"
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default PodcastDetailsEdit
