'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, BookMetadata } from '@/types/api'
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import Checkbox from '../ui/Checkbox'
import MultiSelect, { MultiSelectItem } from '../ui/MultiSelect'
import SlateEditor from '../ui/SlateEditor'
import TextInput from '../ui/TextInput'
import TwoStageMultiSelect from '../ui/TwoStageMultiSelect'

type Details = Omit<BookMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'publishedDate'>

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

  const { media, metadata: mediaMetadata } = useMemo(() => {
    const media = libraryItem.media || {}
    const metadata = (media.metadata as Details) || {}
    return { media, metadata }
  }, [libraryItem.media])

  const initialDetails = useMemo<Details>(() => mediaMetadata, [mediaMetadata])

  const initialTags = useMemo(() => [...(media.tags || [])], [media.tags])

  const [title, setTitle] = useState(initialDetails.title)
  const [subtitle, setSubtitle] = useState(initialDetails.subtitle)
  const [description, setDescription] = useState(initialDetails.description)
  const [authors, setAuthors] = useState(initialDetails.authors)
  const [narrators, setNarrators] = useState(initialDetails.narrators)
  const [series, setSeries] = useState(initialDetails.series)
  const [publishedYear, setPublishedYear] = useState(initialDetails.publishedYear)
  const [publisher, setPublisher] = useState(initialDetails.publisher)
  const [language, setLanguage] = useState(initialDetails.language)
  const [isbn, setIsbn] = useState(initialDetails.isbn)
  const [asin, setAsin] = useState(initialDetails.asin)
  const [genres, setGenres] = useState(initialDetails.genres)
  const [explicit, setExplicit] = useState(initialDetails.explicit)
  const [abridged, setAbridged] = useState(initialDetails.abridged)
  const [tags, setTags] = useState<string[]>(initialTags)

  useEffect(() => {
    setTitle(initialDetails.title)
    setSubtitle(initialDetails.subtitle)
    setDescription(initialDetails.description)
    setAuthors(initialDetails.authors)
    setNarrators(initialDetails.narrators)
    setSeries(initialDetails.series)
    setPublishedYear(initialDetails.publishedYear)
    setPublisher(initialDetails.publisher)
    setLanguage(initialDetails.language)
    setIsbn(initialDetails.isbn)
    setAsin(initialDetails.asin)
    setGenres(initialDetails.genres)
    setExplicit(initialDetails.explicit)
    setAbridged(initialDetails.abridged)
    setTags(initialTags)
  }, [initialDetails, initialTags])

  const details = useMemo(
    () => ({
      title,
      subtitle,
      description,
      authors,
      narrators,
      series,
      publishedYear,
      publisher,
      language,
      isbn,
      asin,
      genres,
      explicit,
      abridged
    }),
    [title, subtitle, description, authors, narrators, series, publishedYear, publisher, language, isbn, asin, genres, explicit, abridged]
  )

  const authorItems = useMemo(() => authors.map((a) => ({ value: a.id, content: a.name })), [authors])
  const handleAddAuthor = useCallback((item: MultiSelectItem<string>) => {
    setAuthors((prev) => [...prev, { id: item.value, name: item.content }])
  }, [])
  const handleRemoveAuthor = useCallback((item: MultiSelectItem<string>) => {
    setAuthors((prev) => prev.filter((a) => a.id !== item.value))
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
      series.map((s) => ({
        value: s.id,
        content: { value: s.name, modifier: s.sequence }
      })),
    [series]
  )
  const handleAddSeries = useCallback((item: SeriesSelectItem) => {
    const newSeries = {
      id: item.value,
      name: item.content.value,
      sequence: item.content.modifier
    }
    setSeries((prev) => [...prev, newSeries])
  }, [])
  const handleRemoveSeries = useCallback((item: SeriesSelectItem) => {
    setSeries((prev) => prev.filter((s) => s.id !== item.value))
  }, [])
  const handleEditSeries = useCallback((item: SeriesSelectItem, index: number) => {
    const editedSeries = {
      id: item.value,
      name: item.content.value,
      sequence: item.content.modifier
    }
    setSeries((prev) => {
      const newSeriesList = [...prev]
      newSeriesList[index] = editedSeries
      return newSeriesList
    })
  }, [])

  const genreItems = useMemo(() => (genres || []).map((g) => ({ value: g, content: g })), [genres])
  const handleAddGenre = useCallback((item: MultiSelectItem<string>) => {
    setGenres((prev) => (prev ? [...prev, item.content] : [item.content]))
  }, [])
  const handleRemoveGenre = useCallback((item: MultiSelectItem<string>) => {
    setGenres((prev) => (prev ? prev.filter((g) => g !== item.value) : []))
  }, [])

  const tagItems = useMemo(() => tags.map((t) => ({ value: t, content: t })), [tags])
  const handleAddTag = useCallback((item: MultiSelectItem<string>) => {
    setTags((prev) => [...prev, item.content])
  }, [])
  const handleRemoveTag = useCallback((item: MultiSelectItem<string>) => {
    setTags((prev) => prev.filter((t) => t !== item.value))
  }, [])

  const narratorItems = useMemo(() => (narrators || []).map((n) => ({ value: n, content: n })), [narrators])
  const handleAddNarrator = useCallback((item: MultiSelectItem<string>) => {
    setNarrators((prev) => (prev ? [...prev, item.content] : [item.content]))
  }, [])
  const handleRemoveNarrator = useCallback((item: MultiSelectItem<string>) => {
    setNarrators((prev) => (prev ? prev.filter((n) => n !== item.value) : []))
  }, [])

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
          title: title,
          author: (authors || []).map((au) => au.name).join(', ')
        }
      },
      mapBatchDetails: (batchDetails: Partial<Details & { tags: string[] }>, mapType = 'overwrite') => {
        const { tags: newTags, ...details } = batchDetails

        if (newTags) {
          setTags((prev) => (mapType === 'append' ? [...new Set([...prev, ...newTags])] : [...newTags]))
        }

        if (mapType === 'overwrite') {
          if (details.title !== undefined) setTitle(details.title)
          if (details.subtitle !== undefined) setSubtitle(details.subtitle)
          if (details.description !== undefined) setDescription(details.description)
          if (details.publishedYear !== undefined) setPublishedYear(details.publishedYear)
          if (details.publisher !== undefined) setPublisher(details.publisher)
          if (details.language !== undefined) setLanguage(details.language)
          if (details.isbn !== undefined) setIsbn(details.isbn)
          if (details.asin !== undefined) setAsin(details.asin)
          if (details.explicit !== undefined) setExplicit(details.explicit)
          if (details.abridged !== undefined) setAbridged(details.abridged)
          if (details.authors !== undefined) setAuthors(details.authors.map((a) => ({ ...a })))
          if (details.narrators !== undefined) setNarrators([...details.narrators])
          if (details.series !== undefined) setSeries(details.series.map((s) => ({ ...s })))
          if (details.genres !== undefined) setGenres([...details.genres])
        } else {
          // Append logic
          if (details.genres) {
            setGenres((prev) => [...new Set([...(prev || []), ...details.genres!])])
          }
          if (details.narrators) {
            setNarrators((prev) => [...new Set([...(prev || []), ...details.narrators!])])
          }
          if (details.authors) {
            setAuthors((prev) => {
              const unique = details.authors!.filter((newItem) => !prev.find((p) => p.id === newItem.id))
              return [...prev, ...unique.map((a) => ({ ...a }))]
            })
          }
          if (details.series) {
            setSeries((prev) => {
              const unique = details.series!.filter((newItem) => !prev.find((p) => p.id === newItem.id))
              return [...prev, ...unique.map((s) => ({ ...s }))]
            })
          }
        }
      }
    }),
    [submitForm, title, authors]
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
            <TextInput value={title || ''} onChange={setTitle} label={t('LabelTitle')} />
          </div>
          <div className="grow px-1 mt-2 md:mt-0">
            <TextInput value={subtitle || ''} onChange={setSubtitle} label={t('LabelSubtitle')} />
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
            <TextInput value={publishedYear || ''} onChange={setPublishedYear} type="number" label={t('LabelPublishYear')} />
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

        <SlateEditor srcContent={mediaMetadata.description || ''} onUpdate={setDescription} label={t('LabelDescription')} className="mt-2" />

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
            <TextInput value={isbn || ''} onChange={setIsbn} label="ISBN" />
          </div>
          <div className="w-1/2 md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={asin || ''} onChange={setAsin} label="ASIN" />
          </div>
        </div>

        <div className="flex flex-wrap mt-2 -mx-1">
          <div className="w-full md:w-1/4 px-1">
            <TextInput value={publisher || ''} onChange={setPublisher} label={t('LabelPublisher')} />
          </div>
          <div className="w-1/2 md:w-1/4 px-1 mt-2 md:mt-0">
            <TextInput value={language || ''} onChange={setLanguage} label={t('LabelLanguage')} />
          </div>
          <div className="grow px-1 pt-6 mt-2 md:mt-0">
            <div className="flex justify-center">
              <Checkbox
                value={explicit}
                onChange={setExplicit}
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
                value={abridged}
                onChange={setAbridged}
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
