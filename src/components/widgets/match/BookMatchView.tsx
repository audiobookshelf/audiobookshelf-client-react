'use client'

import { MultiSelectItem } from '@/components/ui/MultiSelect'
import BaseMatchView from '@/components/widgets/match/BaseMatchView'
import CheckboxMatchFieldEditor from '@/components/widgets/match/CheckboxMatchFieldEditor'
import CoverMatchFieldEditor from '@/components/widgets/match/CoverMatchFieldEditor'
import MultiSelectMatchFieldEditor from '@/components/widgets/match/MultiSelectMatchFieldEditor'
import SlateEditorMatchFieldEditor from '@/components/widgets/match/SlateEditorMatchFieldEditor'
import TextInputMatchFieldEditor from '@/components/widgets/match/TextInputMatchFieldEditor'
import TwoStageMultiSelectMatchFieldEditor from '@/components/widgets/match/TwoStageMultiSelectMatchFieldEditor'
import { useMultiSelectMatchField } from '@/hooks/useMultiSelectMatchField'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getMatchBooleanValue, getMatchStringValue, processBookMatchData } from '@/lib/matchUtils'
import { BookLibraryItem, BookSearchResult, isBookMedia, UpdateLibraryItemMediaPayload } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface BookMatchUsage {
  title: boolean
  subtitle: boolean
  cover: boolean
  author: boolean
  narrator: boolean
  description: boolean
  publisher: boolean
  publishedYear: boolean
  series: boolean
  genres: boolean
  tags: boolean
  language: boolean
  explicit: boolean
  asin: boolean
  isbn: boolean
  abridged: boolean
  [key: string]: boolean
}

interface BookMatchViewProps {
  selectedMatchOrig: BookSearchResult
  libraryItemId: string
  media: BookLibraryItem['media']
  mediaMetadata: BookLibraryItem['media']['metadata']
  coverUrl: string | null
  bookCoverAspectRatio: number
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  availableNarrators: MultiSelectItem<string>[]
  availableSeries: MultiSelectItem<string>[]
  onDone: () => void
}

const defaultMatchUsage: BookMatchUsage = {
  title: true,
  subtitle: true,
  cover: true,
  author: true,
  narrator: true,
  description: true,
  publisher: true,
  publishedYear: true,
  series: true,
  genres: true,
  tags: true,
  language: true,
  explicit: true,
  asin: true,
  isbn: true,
  abridged: true
}

export default function BookMatchView({
  selectedMatchOrig,
  libraryItemId,
  media,
  mediaMetadata,
  coverUrl,
  bookCoverAspectRatio,
  availableGenres,
  availableTags,
  availableNarrators,
  availableSeries,
  onDone
}: BookMatchViewProps) {
  const t = useTypeSafeTranslations()
  const [selectedMatch, setSelectedMatch] = useState<BookSearchResult>(() => processBookMatchData(selectedMatchOrig))

  // Factory function for field value handlers
  const createFieldValueHandler = useCallback(
    (field: string) => (value: string | boolean) => {
      setSelectedMatch((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Multi-select field hooks
  const narratorField = useMultiSelectMatchField(selectedMatch, 'narrator', setSelectedMatch)
  const genresField = useMultiSelectMatchField(selectedMatch, 'genres', setSelectedMatch)
  const tagsField = useMultiSelectMatchField(selectedMatch, 'tags', setSelectedMatch)

  // Combined items for multi-selects
  const allGenres = useMemo(() => {
    const currentGenres = availableGenres.map((g) => g.value)
    const matchGenres = selectedMatch?.genres ? (Array.isArray(selectedMatch.genres) ? selectedMatch.genres : [selectedMatch.genres]) : []
    return [...new Set([...currentGenres, ...matchGenres])].map((g) => ({ value: g, content: g }))
  }, [availableGenres, selectedMatch?.genres])

  const allTags = useMemo(() => {
    const currentTags = availableTags.map((t) => t.value)
    const matchTags = selectedMatch?.tags ? (Array.isArray(selectedMatch.tags) ? selectedMatch.tags : [selectedMatch.tags]) : []
    return [...new Set([...currentTags, ...matchTags])].map((t) => ({ value: t, content: t }))
  }, [availableTags, selectedMatch?.tags])

  // Series handlers
  const seriesItems = useMemo(() => {
    if (!selectedMatch?.series) return []
    return selectedMatch.series.map((s: { series: string; sequence?: string; id?: string; name?: string }) => ({
      value: s.id || `new-${Math.floor(Math.random() * 10000)}`,
      content: { value: s.name || s.series, modifier: s.sequence || '' }
    }))
  }, [selectedMatch])

  const seriesItemsMap = useMemo(() => availableSeries.map((item) => ({ value: item.value, content: item.content as string })), [availableSeries])

  const handleAddSeries = useCallback((item: MultiSelectItem<{ value: string; modifier: string }>) => {
    const newSeries = {
      id: item.value,
      name: item.content.value,
      series: item.content.value,
      sequence: item.content.modifier
    }
    setSelectedMatch((prev) => ({ ...prev, series: [...(prev.series || []), newSeries] }))
  }, [])

  const handleRemoveSeries = useCallback((item: MultiSelectItem<{ value: string; modifier: string }>) => {
    setSelectedMatch((prev) => ({
      ...prev,
      series: (prev.series || []).filter((s: { series: string; sequence?: string; id?: string }) => s.series !== item.content.value)
    }))
  }, [])

  const handleEditSeries = useCallback((item: MultiSelectItem<{ value: string; modifier: string }>, index: number) => {
    const editedSeries = {
      id: item.value,
      name: item.content.value,
      series: item.content.value,
      sequence: item.content.modifier
    }
    setSelectedMatch((prev) => {
      const newSeriesList = [...(prev.series || [])]
      newSeriesList[index] = editedSeries
      return { ...prev, series: newSeriesList }
    })
  }, [])

  const handleSeriesReplaceAll = useCallback((items: { id?: string; name: string; sequence?: string }[]) => {
    const convertedSeries = items.map((s) => ({
      id: s.id || `new-${Math.floor(Math.random() * 10000)}`,
      name: s.name,
      series: s.name,
      sequence: s.sequence || ''
    }))
    setSelectedMatch((prev) => ({ ...prev, series: convertedSeries }))
  }, [])

  // Computed current values
  const authorCurrentValue = useMemo(() => {
    return isBookMedia(media) && media.metadata.authors.length > 0 ? media.metadata.authors.map((a) => a.name).join(', ') : undefined
  }, [media])

  const seriesCurrentValue = useMemo(() => {
    return mediaMetadata.series && mediaMetadata.series.length > 0 && selectedMatch ? mediaMetadata.series : undefined
  }, [mediaMetadata.series, selectedMatch])

  const abridgedCurrentValue = useMemo(() => (isBookMedia(media) ? media.metadata.abridged : undefined), [media])

  // Helper functions to get match values with proper types
  const getStringValue = useCallback((field: keyof BookSearchResult, fallback = '') => getMatchStringValue(selectedMatch, field, fallback), [selectedMatch])

  const getBooleanValue = useCallback(
    (field: keyof BookSearchResult, fallback = false) => getMatchBooleanValue(selectedMatch, field, fallback),
    [selectedMatch]
  )

  const buildMatchUpdatePayload = useCallback((selectedMatchUsage: BookMatchUsage, selectedMatch: BookSearchResult): UpdateLibraryItemMediaPayload | null => {
    const updatePayload: UpdateLibraryItemMediaPayload = { metadata: {} }

    for (const key in selectedMatchUsage) {
      if (!selectedMatchUsage[key as keyof BookMatchUsage]) continue

      const value = selectedMatch[key as keyof BookSearchResult]
      if (value === undefined) continue

      if (key === 'series' && Array.isArray(selectedMatch.series)) {
        updatePayload.metadata!.series = selectedMatch.series.map((s) => ({
          id: `new-${Math.floor(Math.random() * 10000)}`,
          name: s.series,
          sequence: s.sequence || ''
        }))
      } else if (key === 'author') {
        const authorValue = selectedMatch.author
        if (authorValue) {
          const authorNames = Array.isArray(authorValue)
            ? authorValue
            : String(authorValue)
                .split(',')
                .map((au: string) => au.trim())
          updatePayload.metadata!.authors = authorNames
            .filter((au: string) => !!au)
            .map((name: string) => ({ id: `new-${Math.floor(Math.random() * 10000)}`, name }))
        }
      } else if (key === 'narrator') {
        const narratorValue = selectedMatch.narrator
        if (Array.isArray(narratorValue)) {
          updatePayload.metadata!.narrators = narratorValue
        } else if (narratorValue) {
          updatePayload.metadata!.narrators = String(narratorValue)
            .split(',')
            .map((n: string) => n.trim())
            .filter((n: string) => !!n)
        }
      } else if (key === 'genres') {
        updatePayload.metadata!.genres = Array.isArray(value) ? value.filter((g): g is string => !!g) : [value].filter((g): g is string => !!g)
      } else if (key === 'tags') {
        updatePayload.tags = Array.isArray(value) ? value.filter((t): t is string => !!t) : [value].filter((t): t is string => !!t)
      } else if (key === 'cover') {
        updatePayload.url = value as string
      } else if (key === 'explicit' || key === 'abridged') {
        updatePayload.metadata![key] = value as boolean
      } else if (['title', 'subtitle', 'description', 'publisher', 'publishedYear', 'language', 'isbn', 'asin'].includes(key)) {
        updatePayload.metadata![key] = value as string | undefined
      }
    }

    return updatePayload
  }, [])

  return (
    <BaseMatchView
      libraryItemId={libraryItemId}
      defaultMatchUsage={defaultMatchUsage}
      localStorageKey="selectedMatchUsage"
      buildMatchUpdatePayload={buildMatchUpdatePayload}
      selectedMatch={selectedMatch}
      onDone={onDone}
    >
      {({ selectedMatchUsage, createFieldUsageHandler }) => (
        <>
          {selectedMatchOrig.cover && (
            <CoverMatchFieldEditor
              usageChecked={selectedMatchUsage.cover}
              onUsageChange={createFieldUsageHandler('cover')}
              coverUrl={getStringValue('cover')}
              currentCoverUrl={coverUrl}
              bookCoverAspectRatio={bookCoverAspectRatio}
            />
          )}

          {selectedMatchOrig.title && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.title}
              onUsageChange={createFieldUsageHandler('title')}
              value={getStringValue('title')}
              onChange={createFieldValueHandler('title')}
              label={t('LabelTitle')}
              currentValue={mediaMetadata.title}
            />
          )}

          {selectedMatchOrig.subtitle && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.subtitle}
              onUsageChange={createFieldUsageHandler('subtitle')}
              value={getStringValue('subtitle')}
              onChange={createFieldValueHandler('subtitle')}
              label={t('LabelSubtitle')}
              currentValue={mediaMetadata.subtitle}
            />
          )}

          {selectedMatchOrig.author && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.author}
              onUsageChange={createFieldUsageHandler('author')}
              value={getStringValue('author')}
              onChange={createFieldValueHandler('author')}
              label={t('LabelAuthor')}
              currentValue={authorCurrentValue}
            />
          )}

          {selectedMatchOrig.narrator && (
            <MultiSelectMatchFieldEditor
              usageChecked={selectedMatchUsage.narrator}
              onUsageChange={createFieldUsageHandler('narrator')}
              selectedItems={narratorField.selectedItems}
              items={availableNarrators}
              onItemAdded={narratorField.handleAdd}
              onItemRemoved={narratorField.handleRemove}
              onReplaceAll={narratorField.handleReplaceAll}
              label={t('LabelNarrators')}
              currentValue={mediaMetadata.narrators}
              allowNew
            />
          )}

          {selectedMatchOrig.description && (
            <SlateEditorMatchFieldEditor
              usageChecked={selectedMatchUsage.description}
              onUsageChange={createFieldUsageHandler('description')}
              value={getStringValue('description')}
              onChange={createFieldValueHandler('description')}
              label={t('LabelDescription')}
              currentValue={mediaMetadata.description}
            />
          )}

          {selectedMatchOrig.publisher && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.publisher}
              onUsageChange={createFieldUsageHandler('publisher')}
              value={getStringValue('publisher')}
              onChange={createFieldValueHandler('publisher')}
              label={t('LabelPublisher')}
              currentValue={mediaMetadata.publisher}
            />
          )}

          {selectedMatchOrig.publishedYear && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.publishedYear}
              onUsageChange={createFieldUsageHandler('publishedYear')}
              value={getStringValue('publishedYear')}
              onChange={createFieldValueHandler('publishedYear')}
              label={t('LabelPublishYear')}
              currentValue={mediaMetadata.publishedYear}
            />
          )}

          {selectedMatchOrig.series && (
            <TwoStageMultiSelectMatchFieldEditor
              usageChecked={selectedMatchUsage.series}
              onUsageChange={createFieldUsageHandler('series')}
              selectedItems={seriesItems}
              items={seriesItemsMap}
              onItemAdded={handleAddSeries}
              onItemRemoved={handleRemoveSeries}
              onItemEdited={handleEditSeries}
              onReplaceAll={handleSeriesReplaceAll}
              label={t('LabelSeries')}
              currentValue={seriesCurrentValue}
            />
          )}

          {selectedMatchOrig.genres && (
            <MultiSelectMatchFieldEditor
              usageChecked={selectedMatchUsage.genres}
              onUsageChange={createFieldUsageHandler('genres')}
              selectedItems={genresField.selectedItems}
              items={allGenres}
              onItemAdded={genresField.handleAdd}
              onItemRemoved={genresField.handleRemove}
              onReplaceAll={genresField.handleReplaceAll}
              label={t('LabelGenres')}
              currentValue={mediaMetadata.genres}
              allowNew
            />
          )}

          {selectedMatchOrig.tags && (
            <MultiSelectMatchFieldEditor
              usageChecked={selectedMatchUsage.tags}
              onUsageChange={createFieldUsageHandler('tags')}
              selectedItems={tagsField.selectedItems}
              items={allTags}
              onItemAdded={tagsField.handleAdd}
              onItemRemoved={tagsField.handleRemove}
              onReplaceAll={tagsField.handleReplaceAll}
              label={t('LabelTags')}
              currentValue={media.tags}
              allowNew
            />
          )}

          {selectedMatchOrig.language && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.language}
              onUsageChange={createFieldUsageHandler('language')}
              value={getStringValue('language')}
              onChange={createFieldValueHandler('language')}
              label={t('LabelLanguage')}
              currentValue={mediaMetadata.language}
            />
          )}

          {selectedMatchOrig.isbn && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.isbn}
              onUsageChange={createFieldUsageHandler('isbn')}
              value={getStringValue('isbn')}
              onChange={createFieldValueHandler('isbn')}
              label="ISBN"
              currentValue={mediaMetadata.isbn}
            />
          )}

          {selectedMatchOrig.asin && (
            <TextInputMatchFieldEditor
              usageChecked={selectedMatchUsage.asin}
              onUsageChange={createFieldUsageHandler('asin')}
              value={getStringValue('asin')}
              onChange={createFieldValueHandler('asin')}
              label="ASIN"
              currentValue={mediaMetadata.asin}
            />
          )}

          {selectedMatchOrig.explicit != null && (
            <CheckboxMatchFieldEditor
              usageChecked={selectedMatchUsage.explicit}
              onUsageChange={createFieldUsageHandler('explicit')}
              value={getBooleanValue('explicit')}
              onChange={createFieldValueHandler('explicit')}
              label={t('LabelExplicit')}
              currentValue={mediaMetadata.explicit}
              checkboxBgClass="bg-primary"
              borderColorClass="border-border"
              labelClass="ps-2 text-base font-semibold"
            />
          )}

          {selectedMatchOrig.abridged != null && (
            <CheckboxMatchFieldEditor
              usageChecked={selectedMatchUsage.abridged}
              onUsageChange={createFieldUsageHandler('abridged')}
              value={getBooleanValue('abridged')}
              onChange={createFieldValueHandler('abridged')}
              label={t('LabelAbridged')}
              currentValue={abridgedCurrentValue}
              checkboxBgClass="bg-primary"
              borderColorClass="border-border"
              labelClass="ps-2 text-base font-semibold"
              checkedLabelKey="LabelAbridgedChecked"
              uncheckedLabelKey="LabelAbridgedUnchecked"
            />
          )}
        </>
      )}
    </BaseMatchView>
  )
}
