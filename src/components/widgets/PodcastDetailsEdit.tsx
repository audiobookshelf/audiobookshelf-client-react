'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer } from 'react'
import Checkbox from '../ui/Checkbox'
import Dropdown, { DropdownItem } from '../ui/Dropdown'
import MultiSelect, { MultiSelectItem } from '../ui/MultiSelect'
import SlateEditor from '../ui/SlateEditor'
import TextInput from '../ui/TextInput'

type Details = Omit<PodcastMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'imageURL' | 'itunesPageURL' | 'itunesArtistId'>

// Reducer state and actions
interface EditState {
  details: Details
  tags: string[]
  initialDetails: Details
  initialTags: string[]
}

type Action =
  | { type: 'RESET_STATE'; payload: { details: Details; tags: string[] } }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof Details; value: Details[keyof Details] } }
  | { type: 'UPDATE_TAGS'; payload: { tags: string[] } }
  | { type: 'BATCH_UPDATE'; payload: { batchDetails: Partial<Details & { tags: string[] }>; mapType: 'overwrite' | 'append' } }

const podcastDetailsReducer = (state: EditState, action: Action): EditState => {
  switch (action.type) {
    case 'RESET_STATE':
      return {
        ...state,
        details: action.payload.details,
        tags: action.payload.tags,
        initialDetails: action.payload.details,
        initialTags: action.payload.tags
      }
    case 'UPDATE_FIELD':
      return {
        ...state,
        details: {
          ...state.details,
          [action.payload.field]: action.payload.value
        }
      }
    case 'UPDATE_TAGS':
      return {
        ...state,
        tags: action.payload.tags
      }
    case 'BATCH_UPDATE': {
      const { batchDetails, mapType } = action.payload
      const { tags: newTags, ...detailsToUpdate } = batchDetails

      const finalTags = newTags ? (mapType === 'append' ? [...new Set([...state.tags, ...newTags])] : [...newTags]) : state.tags

      if (mapType === 'overwrite') {
        return {
          ...state,
          details: { ...state.details, ...detailsToUpdate },
          tags: finalTags
        }
      } else {
        // Append logic
        return {
          ...state,
          details: {
            ...state.details,
            genres: detailsToUpdate.genres ? [...new Set([...(state.details.genres || []), ...detailsToUpdate.genres])] : state.details.genres
          },
          tags: finalTags
        }
      }
    }
    default:
      return state
  }
}

export interface UpdatePayload {
  metadata?: Partial<Details>
  tags?: string[]
}

export interface PodcastDetailsEditRef {
  submit: () => void
  getTitleAndAuthorName: () => { title: string | null; author: string }
  mapBatchDetails: (batchDetails: Partial<Details & { tags: string[] }>, mapType?: 'overwrite' | 'append') => void
}

interface PodcastDetailsEditProps {
  libraryItem: PodcastLibraryItem
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  onChange?: (details: { libraryItemId: string; hasChanges: boolean }) => void
  onSubmit?: (details: { updatePayload: UpdatePayload; hasChanges: boolean }) => void
  ref?: React.Ref<PodcastDetailsEditRef>
}

const PodcastDetailsEdit = ({ libraryItem, availableGenres = [], availableTags = [], onChange, onSubmit, ref }: PodcastDetailsEditProps) => {
  const t = useTypeSafeTranslations()

  const media = useMemo(() => libraryItem.media || {}, [libraryItem.media])

  const [state, dispatch] = useReducer(podcastDetailsReducer, {
    details: (media.metadata as Details) || {},
    tags: [...(media.tags || [])],
    initialDetails: (media.metadata as Details) || {},
    initialTags: [...(media.tags || [])]
  })

  const { details, tags, initialDetails, initialTags } = state

  useEffect(() => {
    dispatch({
      type: 'RESET_STATE',
      payload: {
        details: (media.metadata as Details) || {},
        tags: [...(media.tags || [])]
      }
    })
  }, [media])

  const podcastTypeItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelEpisodic'), value: 'episodic' },
      { text: t('LabelSerial'), value: 'serial' }
    ],
    [t]
  )

  const genreItems = useMemo(() => (details.genres || []).map((g) => ({ value: g, content: g })), [details.genres])
  const handleAddGenre = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'genres', value: [...(details.genres || []), item.content] } })
    },
    [details.genres]
  )
  const handleRemoveGenre = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'genres', value: (details.genres || []).filter((g) => g !== item.value) } })
    },
    [details.genres]
  )

  const tagItems = useMemo(() => tags.map((t) => ({ value: t, content: t })), [tags])
  const handleAddTag = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_TAGS', payload: { tags: [...tags, item.content] } })
    },
    [tags]
  )
  const handleRemoveTag = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_TAGS', payload: { tags: tags.filter((t) => t !== item.value) } })
    },
    [tags]
  )

  const handleFieldUpdate = useCallback(
    <K extends keyof Details>(field: K) =>
      (value: Details[K] | string | number) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { field, value: value as Details[K] } })
      },
    []
  )

  const changes = useMemo(() => {
    const changedEntries = (Object.keys(details) as Array<keyof Details>)
      .filter((key) => {
        const initialValue = initialDetails[key]
        const currentValue = details[key]

        if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
          return JSON.stringify(currentValue) !== JSON.stringify(initialValue)
        }

        // Intentional != to match Vue component behavior
        return currentValue != initialValue
      })
      .map((key) => [key, details[key]])

    const metadataUpdate = Object.fromEntries(changedEntries) as Partial<Details>

    const updatePayload: UpdatePayload = {}
    if (changedEntries.length > 0) {
      updatePayload.metadata = metadataUpdate
    }

    if (JSON.stringify(tags) !== JSON.stringify(initialTags)) {
      updatePayload.tags = tags
    }

    return {
      updatePayload,
      hasChanges: Object.keys(updatePayload).length > 0
    }
  }, [details, initialDetails, tags, initialTags])

  const handleInputChange = useCallback(() => {
    onChange?.({
      libraryItemId: libraryItem.id,
      hasChanges: changes.hasChanges
    })
  }, [libraryItem.id, onChange, changes.hasChanges])

  useEffect(() => {
    handleInputChange()
  }, [handleInputChange])

  const submitForm = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      onSubmit?.(changes)
    },
    [changes, onSubmit]
  )

  useImperativeHandle(
    ref,
    () => ({
      submit: () => submitForm(),
      getTitleAndAuthorName: () => {
        return {
          title: details.title,
          author: details.author || ''
        }
      },
      mapBatchDetails: (batchDetails: Partial<Details & { tags: string[] }>, mapType = 'overwrite') => {
        dispatch({ type: 'BATCH_UPDATE', payload: { batchDetails, mapType } })
      }
    }),
    [submitForm, details.title, details.author]
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
            <TextInput value={details.title || ''} onChange={handleFieldUpdate('title')} label={t('LabelTitle')} />
          </div>
          <div className="grow px-1 mt-2 md:mt-0">
            <TextInput value={details.author || ''} onChange={handleFieldUpdate('author')} label={t('LabelAuthor')} />
          </div>
        </div>

        <TextInput value={details.feedURL || ''} onChange={handleFieldUpdate('feedURL')} label={t('LabelRSSFeedURL')} className="mt-2" />

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
            <TextInput value={details.releaseDate || ''} onChange={handleFieldUpdate('releaseDate')} label={t('LabelReleaseDate')} />
          </div>
          <div className="w-full md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={details.itunesId || ''} onChange={handleFieldUpdate('itunesId')} label="iTunes ID" />
          </div>
          <div className="w-full md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={details.language || ''} onChange={handleFieldUpdate('language')} label={t('LabelLanguage')} />
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
              size="small"
              onChange={handleFieldUpdate('podcastType')}
              className="max-w-52"
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default PodcastDetailsEdit
