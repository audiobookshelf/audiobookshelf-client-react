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
  | { type: 'BATCH_UPDATE'; payload: { batchDetails: Partial<Details & { tags: string[] }>; mapType: 'overwrite' | 'append' } }
  | { type: 'ADD_ITEM'; payload: { field: 'authors' | 'series'; value: AuthorShort | SeriesShort } }
  | { type: 'REMOVE_ITEM'; payload: { field: 'authors' | 'series'; value: string } } // value is id
  | { type: 'EDIT_SERIES'; payload: { index: number; value: SeriesShort } }
  | { type: 'ADD_STRING_ITEM'; payload: { field: 'narrators' | 'genres' | 'tags'; value: string } }
  | { type: 'REMOVE_STRING_ITEM'; payload: { field: 'narrators' | 'genres' | 'tags'; value: string } }

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
    case 'ADD_ITEM': {
      const currentArray = state.details[action.payload.field] as (AuthorShort | SeriesShort)[]
      return {
        ...state,
        details: {
          ...state.details,
          [action.payload.field]: [...currentArray, action.payload.value]
        }
      }
    }
    case 'REMOVE_ITEM': {
      const currentArray = state.details[action.payload.field] as (AuthorShort | SeriesShort)[]
      return {
        ...state,
        details: {
          ...state.details,
          [action.payload.field]: currentArray.filter((item) => item.id !== action.payload.value)
        }
      }
    }
    case 'EDIT_SERIES': {
      const newSeriesList = [...state.details.series]
      newSeriesList[action.payload.index] = action.payload.value
      return {
        ...state,
        details: {
          ...state.details,
          series: newSeriesList
        }
      }
    }
    case 'ADD_STRING_ITEM': {
      if (action.payload.field === 'tags') {
        return { ...state, tags: [...state.tags, action.payload.value] }
      }
      const currentArray = state.details[action.payload.field]
      return {
        ...state,
        details: {
          ...state.details,
          [action.payload.field]: [...(currentArray || []), action.payload.value]
        }
      }
    }
    case 'REMOVE_STRING_ITEM': {
      if (action.payload.field === 'tags') {
        return { ...state, tags: state.tags.filter((tag) => tag !== action.payload.value) }
      }
      const currentArray = state.details[action.payload.field]
      return {
        ...state,
        details: {
          ...state.details,
          [action.payload.field]: (currentArray || []).filter((item) => item !== action.payload.value)
        }
      }
    }
    case 'BATCH_UPDATE': {
      const { batchDetails, mapType } = action.payload
      const { tags: newTags, ...details } = batchDetails
      let updatedTags = state.tags
      const updatedDetails: Details = { ...state.details }

      if (newTags) {
        updatedTags = mapType === 'append' ? [...new Set([...state.tags, ...newTags])] : [...newTags]
      }

      if (mapType === 'overwrite') {
        // Overwrite all fields present in details
        Object.keys(details).forEach((keyStr) => {
          const key = keyStr as keyof Details
          const value = details[key]
          if (value !== undefined) {
            // @ts-expect-error - key is a string and value is any, so TS complains
            updatedDetails[key] = value
          }
        })
      } else {
        // Append logic for arrays
        if (details.genres) {
          updatedDetails.genres = [...new Set([...(state.details.genres || []), ...details.genres])]
        }
        if (details.narrators) {
          updatedDetails.narrators = [...new Set([...(state.details.narrators || []), ...details.narrators])]
        }
        if (details.authors) {
          const unique = details.authors.filter((newItem) => !state.details.authors.find((p) => p.id === newItem.id))
          updatedDetails.authors = [...state.details.authors, ...unique]
        }
        if (details.series) {
          const unique = details.series.filter((newItem) => !state.details.series.find((p) => p.id === newItem.id))
          updatedDetails.series = [...state.details.series, ...unique]
        }
      }

      return { ...state, details: updatedDetails, tags: updatedTags }
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
  const handleAddAuthor = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'ADD_ITEM', payload: { field: 'authors', value: { id: item.value, name: item.content } } })
  }, [])
  const handleRemoveAuthor = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { field: 'authors', value: item.value } })
  }, [])

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
  const handleAddSeries = useCallback((item: SeriesSelectItem) => {
    const newSeries: SeriesShort = {
      id: item.value,
      name: item.content.value,
      sequence: item.content.modifier
    }
    dispatch({ type: 'ADD_ITEM', payload: { field: 'series', value: newSeries } })
  }, [])
  const handleRemoveSeries = useCallback((item: SeriesSelectItem) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { field: 'series', value: item.value } })
  }, [])
  const handleEditSeries = useCallback((item: SeriesSelectItem, index: number) => {
    const editedSeries: SeriesShort = {
      id: item.value,
      name: item.content.value,
      sequence: item.content.modifier
    }
    dispatch({ type: 'EDIT_SERIES', payload: { index, value: editedSeries } })
  }, [])

  const genreItems = useMemo(() => (details.genres || []).map((g) => ({ value: g, content: g })), [details.genres])
  const handleAddGenre = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'ADD_STRING_ITEM', payload: { field: 'genres', value: item.content } })
  }, [])
  const handleRemoveGenre = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'REMOVE_STRING_ITEM', payload: { field: 'genres', value: item.value } })
  }, [])

  const tagItems = useMemo(() => tags.map((t) => ({ value: t, content: t })), [tags])
  const handleAddTag = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'ADD_STRING_ITEM', payload: { field: 'tags', value: item.content } })
  }, [])
  const handleRemoveTag = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'REMOVE_STRING_ITEM', payload: { field: 'tags', value: item.value } })
  }, [])

  const narratorItems = useMemo(() => (details.narrators || []).map((n) => ({ value: n, content: n })), [details.narrators])
  const handleAddNarrator = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'ADD_STRING_ITEM', payload: { field: 'narrators', value: item.content } })
  }, [])
  const handleRemoveNarrator = useCallback((item: MultiSelectItem<string>) => {
    dispatch({ type: 'REMOVE_STRING_ITEM', payload: { field: 'narrators', value: item.value } })
  }, [])

  const handleFieldUpdate = useCallback(
    <K extends keyof Details>(field: K) =>
      (value: Details[K]) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { field, value } })
      },
    []
  )

  const checkForChanges = useCallback(() => {
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
      hasChanges: checkForChanges().hasChanges
    })
  }, [libraryItem.id, onChange, checkForChanges])

  useEffect(() => {
    handleInputChange()
  }, [details, tags, handleInputChange])

  const submitForm = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      onSubmit?.(checkForChanges())
    },
    [checkForChanges, onSubmit]
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
