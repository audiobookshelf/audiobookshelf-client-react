'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AuthorShort, BookLibraryItem, BookMetadata, SeriesShort } from '@/types/api'
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer } from 'react'
import Checkbox from '../ui/Checkbox'
import MultiSelect, { MultiSelectItem } from '../ui/MultiSelect'
import SlateEditor from '../ui/SlateEditor'
import TextInput from '../ui/TextInput'
import TwoStageMultiSelect from '../ui/TwoStageMultiSelect'

type Details = Omit<BookMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'publishedDate'>

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

const bookDetailsReducer = (state: EditState, action: Action): EditState => {
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
            genres: detailsToUpdate.genres ? [...new Set([...(state.details.genres || []), ...detailsToUpdate.genres])] : state.details.genres,
            narrators: detailsToUpdate.narrators ? [...new Set([...(state.details.narrators || []), ...detailsToUpdate.narrators])] : state.details.narrators,
            authors: detailsToUpdate.authors
              ? [...state.details.authors, ...detailsToUpdate.authors.filter((newItem) => !state.details.authors.find((p) => p.id === newItem.id))]
              : state.details.authors,
            series: detailsToUpdate.series
              ? [...state.details.series, ...detailsToUpdate.series.filter((newItem) => !state.details.series.find((p) => p.id === newItem.id))]
              : state.details.series
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

export interface BookDetailsEditRef {
  submit: () => void
  getTitleAndAuthorName: () => { title: string | null; author: string }
  mapBatchDetails: (batchDetails: Partial<Details & { tags: string[] }>, mapType?: 'overwrite' | 'append') => void
}

interface BookDetailsEditProps {
  libraryItem: BookLibraryItem
  availableAuthors: MultiSelectItem<string>[]
  availableNarrators: MultiSelectItem<string>[]
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  availableSeries: MultiSelectItem<string>[]
  onChange?: (details: { libraryItemId: string; hasChanges: boolean }) => void
  onSubmit?: (details: { updatePayload: UpdatePayload; hasChanges: boolean }) => void
  ref?: React.Ref<BookDetailsEditRef>
}

const BookDetailsEdit = ({
  libraryItem,
  availableAuthors = [],
  availableNarrators = [],
  availableGenres = [],
  availableTags = [],
  availableSeries = [],
  onChange,
  onSubmit,
  ref
}: BookDetailsEditProps) => {
  const t = useTypeSafeTranslations()

  const media = useMemo(() => libraryItem.media || {}, [libraryItem.media])

  const [state, dispatch] = useReducer(bookDetailsReducer, {
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

  const authorItems = useMemo(() => details.authors.map((a) => ({ value: a.id, content: a.name })), [details.authors])
  const handleAddAuthor = useCallback(
    (item: MultiSelectItem<string>) => {
      const newAuthor: AuthorShort = { id: item.value, name: item.content }
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'authors', value: [...details.authors, newAuthor] } })
    },
    [details.authors]
  )
  const handleRemoveAuthor = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'authors', value: details.authors.filter((a) => a.id !== item.value) } })
    },
    [details.authors]
  )

  type SeriesSelectItem = {
    value: string
    content: {
      value: string
      modifier: string
    }
  }

  const seriesItems = useMemo(
    () =>
      details.series.map((s) => ({
        value: s.id,
        content: { value: s.name, modifier: s.sequence }
      })),
    [details.series]
  )
  const handleAddSeries = useCallback(
    (item: SeriesSelectItem) => {
      const newSeries: SeriesShort = {
        id: item.value,
        name: item.content.value,
        sequence: item.content.modifier
      }
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'series', value: [...details.series, newSeries] } })
    },
    [details.series]
  )
  const handleRemoveSeries = useCallback(
    (item: SeriesSelectItem) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'series', value: details.series.filter((s) => s.id !== item.value) } })
    },
    [details.series]
  )
  const handleEditSeries = useCallback(
    (item: SeriesSelectItem, index: number) => {
      const editedSeries: SeriesShort = {
        id: item.value,
        name: item.content.value,
        sequence: item.content.modifier
      }
      const newSeriesList = [...details.series]
      newSeriesList[index] = editedSeries
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'series', value: newSeriesList } })
    },
    [details.series]
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

  const narratorItems = useMemo(() => (details.narrators || []).map((n) => ({ value: n, content: n })), [details.narrators])
  const handleAddNarrator = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'narrators', value: [...(details.narrators || []), item.content] } })
    },
    [details.narrators]
  )
  const handleRemoveNarrator = useCallback(
    (item: MultiSelectItem<string>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field: 'narrators', value: (details.narrators || []).filter((n) => n !== item.value) } })
    },
    [details.narrators]
  )

  const handleFieldUpdate = useCallback(
    <K extends keyof Details>(field: K) =>
      (value: Details[K]) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { field, value } })
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

        return currentValue !== initialValue
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
          author: (details.authors || []).map((au) => au.name).join(', ')
        }
      },
      mapBatchDetails: (batchDetails: Partial<Details & { tags: string[] }>, mapType = 'overwrite') => {
        dispatch({ type: 'BATCH_UPDATE', payload: { batchDetails, mapType } })
      }
    }),
    [submitForm, details.title, details.authors]
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
        <div className="flex flex-wrap -mx-1">
          <div className="w-full md:w-1/2 px-1">
            <TextInput value={details.title || ''} onChange={handleFieldUpdate('title')} label={t('LabelTitle')} />
          </div>
          <div className="grow px-1 mt-2 md:mt-0">
            <TextInput value={details.subtitle || ''} onChange={handleFieldUpdate('subtitle')} label={t('LabelSubtitle')} />
          </div>
        </div>

        <div className="flex flex-wrap mt-2 -mx-1">
          <div className="w-full md:w-3/4 px-1">
            <MultiSelect
              selectedItems={authorItems}
              onItemAdded={handleAddAuthor}
              onItemRemoved={handleRemoveAuthor}
              label={t('LabelAuthors')}
              items={availableAuthors}
              allowNew
            />
          </div>
          <div className="grow px-1 mt-2 md:mt-0">
            <TextInput value={details.publishedYear || ''} onChange={handleFieldUpdate('publishedYear')} type="number" label={t('LabelPublishYear')} />
          </div>
        </div>

        <div className="flex mt-2 -mx-1">
          <div className="grow px-1">
            <TwoStageMultiSelect
              label={t('LabelSeries')}
              items={availableSeries.map((item) => ({ value: item.value, content: item.content as string }))}
              selectedItems={seriesItems}
              onItemAdded={handleAddSeries}
              onItemRemoved={handleRemoveSeries}
              onItemEdited={handleEditSeries}
            />
          </div>
        </div>

        <SlateEditor srcContent={initialDetails.description || ''} onUpdate={handleFieldUpdate('description')} label={t('LabelDescription')} className="mt-2" />

        <div className="flex flex-wrap mt-2 -mx-1">
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

        <div className="flex flex-wrap mt-2 -mx-1">
          <div className="w-full md:w-1/2 px-1">
            <MultiSelect
              selectedItems={narratorItems}
              onItemAdded={handleAddNarrator}
              onItemRemoved={handleRemoveNarrator}
              label={t('LabelNarrators')}
              items={availableNarrators}
              allowNew
            />
          </div>
          <div className="w-1/2 md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={details.isbn || ''} onChange={handleFieldUpdate('isbn')} label="ISBN" />
          </div>
          <div className="w-1/2 md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={details.asin || ''} onChange={handleFieldUpdate('asin')} label="ASIN" />
          </div>
        </div>

        <div className="flex flex-wrap mt-2 -mx-1">
          <div className="w-full md:w-1/4 px-1">
            <TextInput value={details.publisher || ''} onChange={handleFieldUpdate('publisher')} label={t('LabelPublisher')} />
          </div>
          <div className="w-1/2 md:w-1/4 px-1 mt-2 md:mt-0">
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
          <div className="grow px-1 pt-6 mt-2 md:mt-0">
            <div className="flex justify-center">
              <Checkbox
                value={details.abridged}
                onChange={handleFieldUpdate('abridged')}
                label={t('LabelAbridged')}
                checkboxBgClass="bg-primary"
                borderColorClass="border-gray-600"
                labelClass="ps-2 text-base font-semibold"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default BookDetailsEdit
