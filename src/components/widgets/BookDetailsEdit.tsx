'use client'

import { DetailsEditRef, UpdatePayload, useDetailsEdit } from '@/hooks/useDetailsEdit'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AuthorMinified, BookLibraryItem, BookMetadata, SeriesMinified } from '@/types/api'
import React, { useCallback, useMemo } from 'react'
import Checkbox from '../ui/Checkbox'
import MultiSelect, { MultiSelectItem } from '../ui/MultiSelect'
import SlateEditor from '../ui/SlateEditor'
import TextInput from '../ui/TextInput'
import TwoStageMultiSelect from '../ui/TwoStageMultiSelect'

type Details = Omit<BookMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'publishedDate'>

export type BookDetailsEditRef = DetailsEditRef<Details>
export type BookUpdatePayload = UpdatePayload<Details>

interface BookDetailsEditProps {
  libraryItem: BookLibraryItem
  availableAuthors: MultiSelectItem<string>[]
  availableNarrators: MultiSelectItem<string>[]
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  availableSeries: MultiSelectItem<string>[]
  onChange?: (details: { libraryItemId: string; hasChanges: boolean }) => void
  onSubmit?: (details: { updatePayload: UpdatePayload<Details>; hasChanges: boolean }) => void
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

  const batchAppendLogic = useCallback(
    (state: { details: Details }, detailsToUpdate: Partial<Details>) => ({
      ...state.details,
      genres: detailsToUpdate.genres ? [...new Set([...(state.details.genres || []), ...detailsToUpdate.genres])] : state.details.genres,
      narrators: detailsToUpdate.narrators ? [...new Set([...(state.details.narrators || []), ...detailsToUpdate.narrators])] : state.details.narrators,
      authors: detailsToUpdate.authors
        ? [...state.details.authors, ...detailsToUpdate.authors.filter((newItem) => !state.details.authors.find((p) => p.id === newItem.id))]
        : state.details.authors,
      series: detailsToUpdate.series
        ? [...state.details.series, ...detailsToUpdate.series.filter((newItem) => !state.details.series.find((p) => p.id === newItem.id))]
        : state.details.series
    }),
    []
  )

  const extractAuthor = useCallback((details: Details) => {
    return (details.authors || []).map((au) => au.name).join(', ')
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
    batchAppendLogic
  })

  const authorItems = useMemo(() => details.authors.map((a) => ({ value: a.id, content: a.name })), [details.authors])
  const handleAddAuthor = useCallback(
    (item: MultiSelectItem<string>) => {
      const newAuthor: AuthorMinified = { id: item.value, name: item.content }
      handleFieldUpdate('authors')([...details.authors, newAuthor])
    },
    [details.authors, handleFieldUpdate]
  )
  const handleRemoveAuthor = useCallback(
    (item: MultiSelectItem<string>) => {
      handleFieldUpdate('authors')(details.authors.filter((a) => a.id !== item.value))
    },
    [details.authors, handleFieldUpdate]
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
        content: { value: s.name, modifier: s.sequence || '' }
      })),
    [details.series]
  )
  const handleAddSeries = useCallback(
    (item: SeriesSelectItem) => {
      const newSeries: SeriesMinified = {
        id: item.value,
        name: item.content.value,
        sequence: item.content.modifier
      }
      handleFieldUpdate('series')([...details.series, newSeries])
    },
    [details.series, handleFieldUpdate]
  )
  const handleRemoveSeries = useCallback(
    (item: SeriesSelectItem) => {
      handleFieldUpdate('series')(details.series.filter((s) => s.id !== item.value))
    },
    [details.series, handleFieldUpdate]
  )
  const handleEditSeries = useCallback(
    (item: SeriesSelectItem, index: number) => {
      const editedSeries: SeriesMinified = {
        id: item.value,
        name: item.content.value,
        sequence: item.content.modifier
      }
      const newSeriesList = [...details.series]
      newSeriesList[index] = editedSeries
      handleFieldUpdate('series')(newSeriesList)
    },
    [details.series, handleFieldUpdate]
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

  const narratorItems = useMemo(() => (details.narrators || []).map((n) => ({ value: n, content: n })), [details.narrators])
  const handleAddNarrator = useCallback(
    (item: MultiSelectItem<string>) => {
      handleFieldUpdate('narrators')([...(details.narrators || []), item.content])
    },
    [details.narrators, handleFieldUpdate]
  )
  const handleRemoveNarrator = useCallback(
    (item: MultiSelectItem<string>) => {
      handleFieldUpdate('narrators')((details.narrators || []).filter((n) => n !== item.value))
    },
    [details.narrators, handleFieldUpdate]
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
