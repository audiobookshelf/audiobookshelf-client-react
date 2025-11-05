'use client'

import { applyMatchAction } from '@/app/actions/matchActions'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import CheckboxMatchFieldEditor from '@/components/widgets/match/CheckboxMatchFieldEditor'
import CoverMatchFieldEditor from '@/components/widgets/match/CoverMatchFieldEditor'
import MultiSelectMatchFieldEditor from '@/components/widgets/match/MultiSelectMatchFieldEditor'
import SlateEditorMatchFieldEditor from '@/components/widgets/match/SlateEditorMatchFieldEditor'
import TextInputMatchFieldEditor from '@/components/widgets/match/TextInputMatchFieldEditor'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useMultiSelectMatchField } from '@/hooks/useMultiSelectMatchField'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getMatchBooleanValue, getMatchStringValue, processPodcastMatchData } from '@/lib/matchUtils'
import { isPodcastMedia, PodcastLibraryItem, PodcastSearchResult, UpdateLibraryItemMediaPayload } from '@/types/api'
import React, { useCallback, useMemo, useState, useTransition } from 'react'

interface PodcastMatchUsage {
  title: boolean
  cover: boolean
  author: boolean
  description: boolean
  genres: boolean
  tags: boolean
  language: boolean
  explicit: boolean
  itunesPageUrl: boolean
  itunesId: boolean
  feedUrl: boolean
  releaseDate: boolean
}

interface PodcastMatchViewProps {
  selectedMatchOrig: PodcastSearchResult
  libraryItemId: string
  media: PodcastLibraryItem['media']
  mediaMetadata: PodcastLibraryItem['media']['metadata']
  coverUrl: string | null
  bookCoverAspectRatio: number
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  onDone: () => void
}

const defaultMatchUsage: PodcastMatchUsage = {
  title: true,
  cover: true,
  author: true,
  description: true,
  genres: true,
  tags: true,
  language: true,
  explicit: true,
  itunesPageUrl: true,
  itunesId: true,
  feedUrl: true,
  releaseDate: true
}

export default function PodcastMatchView({
  selectedMatchOrig,
  libraryItemId,
  media,
  mediaMetadata,
  coverUrl,
  bookCoverAspectRatio,
  availableGenres,
  availableTags,
  onDone
}: PodcastMatchViewProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPendingApply, startApplyTransition] = useTransition()

  const [selectedMatch, setSelectedMatch] = useState<PodcastSearchResult>(() => processPodcastMatchData(selectedMatchOrig))

  const [selectedMatchUsage, setSelectedMatchUsage] = useState<PodcastMatchUsage>(() => {
    try {
      const saved = localStorage.getItem('selectedMatchUsage')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultMatchUsage, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load saved selectedMatchUsage', error)
    }
    return defaultMatchUsage
  })

  const selectAll = useMemo(() => Object.values(selectedMatchUsage).every((v) => v === true), [selectedMatchUsage])

  // Factory function for field usage handlers
  const createFieldUsageHandler = useCallback(
    (field: keyof PodcastMatchUsage) => (value: boolean) => {
      setSelectedMatchUsage((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Factory function for field value handlers
  const createFieldValueHandler = useCallback(
    (field: string) => (value: string | number | boolean) => {
      setSelectedMatch((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Multi-select field hooks
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

  const handleSelectAllToggle = useCallback(
    (value: boolean) => {
      const newUsage = Object.keys(selectedMatchUsage).reduce((acc, key) => {
        acc[key as keyof PodcastMatchUsage] = value
        return acc
      }, {} as PodcastMatchUsage)
      setSelectedMatchUsage(newUsage)
    },
    [selectedMatchUsage]
  )

  // Helper functions to get match values with proper types
  const getStringValue = useCallback((field: keyof PodcastSearchResult, fallback = '') => getMatchStringValue(selectedMatch, field, fallback), [selectedMatch])

  const getBooleanValue = useCallback(
    (field: keyof PodcastSearchResult, fallback = false) => getMatchBooleanValue(selectedMatch, field, fallback),
    [selectedMatch]
  )

  const buildMatchUpdatePayload = useCallback((): UpdateLibraryItemMediaPayload | null => {
    const updatePayload: UpdateLibraryItemMediaPayload = { metadata: {} }

    for (const key in selectedMatchUsage) {
      if (!selectedMatchUsage[key as keyof PodcastMatchUsage]) continue

      const value = selectedMatch[key as keyof PodcastSearchResult]
      if (value === undefined) continue

      if (key === 'genres') {
        updatePayload.metadata!.genres = Array.isArray(value) ? value.filter((g): g is string => !!g) : [value].filter((g): g is string => !!g)
      } else if (key === 'tags') {
        updatePayload.tags = Array.isArray(value) ? value.filter((t): t is string => !!t) : [value].filter((t): t is string => !!t)
      } else if (key === 'itunesId') {
        updatePayload.metadata!.itunesId = String(value)
      } else if (key === 'cover') {
        updatePayload.url = value as string
      } else if (key === 'explicit') {
        updatePayload.metadata!.explicit = value as boolean
      } else if (['title', 'description', 'language', 'feedUrl', 'itunesPageUrl', 'releaseDate', 'author'].includes(key)) {
        updatePayload.metadata![key] = value as string | undefined
      }
    }

    return updatePayload
  }, [selectedMatch, selectedMatchUsage])

  const handleSubmitMatchUpdate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const updatePayload = buildMatchUpdatePayload()
      if (!updatePayload || Object.keys(updatePayload).length === 0) {
        return
      }

      // Persist in local storage
      try {
        localStorage.setItem('selectedMatchUsage', JSON.stringify(selectedMatchUsage))
      } catch (error) {
        console.error('Failed to save selectedMatchUsage', error)
      }

      startApplyTransition(async () => {
        try {
          const result = await applyMatchAction(libraryItemId, updatePayload)
          if (result?.updated) {
            showToast(t('ToastItemDetailsUpdateSuccess'), { type: 'success' })
          } else {
            showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
          }
          onDone()
        } catch (error) {
          console.error('Failed to update', error)
          showToast(error instanceof Error ? error.message : t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [buildMatchUpdatePayload, libraryItemId, selectedMatchUsage, t, showToast, onDone]
  )

  return (
    <div className="absolute top-0 left-0 w-full bg-bg h-full px-2 py-6 md:p-8 max-h-full overflow-y-auto overflow-x-hidden">
      <div className="flex mb-4">
        <div className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer" onClick={onDone}>
          <span className="material-symbols text-3xl">arrow_back</span>
        </div>
        <p className="text-xl pl-3">{t('HeaderUpdateDetails')}</p>
      </div>

      <Checkbox value={selectAll} onChange={handleSelectAllToggle} label={t('LabelSelectAll')} checkboxBgClass="bg-bg" />

      <form onSubmit={handleSubmitMatchUpdate}>
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

        {selectedMatchOrig.author && (
          <TextInputMatchFieldEditor
            usageChecked={selectedMatchUsage.author}
            onUsageChange={createFieldUsageHandler('author')}
            value={getStringValue('author')}
            onChange={createFieldValueHandler('author')}
            label={t('LabelAuthor')}
            currentValue={isPodcastMedia(media) ? media.metadata.author : undefined}
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

        {selectedMatchOrig.itunesId && (
          <TextInputMatchFieldEditor
            usageChecked={selectedMatchUsage.itunesId}
            onUsageChange={createFieldUsageHandler('itunesId')}
            value={getStringValue('itunesId')}
            onChange={(val) => createFieldValueHandler('itunesId')(Number(val))}
            type="number"
            label="iTunes ID"
            currentValue={mediaMetadata.itunesId}
          />
        )}

        {selectedMatchOrig.feedUrl && (
          <TextInputMatchFieldEditor
            usageChecked={selectedMatchUsage.feedUrl}
            onUsageChange={createFieldUsageHandler('feedUrl')}
            value={getStringValue('feedUrl')}
            onChange={createFieldValueHandler('feedUrl')}
            label="RSS Feed URL"
            currentValue={mediaMetadata.feedUrl}
          />
        )}

        {selectedMatchOrig.itunesPageUrl && (
          <TextInputMatchFieldEditor
            usageChecked={selectedMatchUsage.itunesPageUrl}
            onUsageChange={createFieldUsageHandler('itunesPageUrl')}
            value={getStringValue('itunesPageUrl')}
            onChange={createFieldValueHandler('itunesPageUrl')}
            label="iTunes Page URL"
            currentValue={mediaMetadata.itunesPageUrl}
          />
        )}

        {selectedMatchOrig.releaseDate && (
          <TextInputMatchFieldEditor
            usageChecked={selectedMatchUsage.releaseDate}
            onUsageChange={createFieldUsageHandler('releaseDate')}
            value={getStringValue('releaseDate')}
            onChange={createFieldValueHandler('releaseDate')}
            label={t('LabelReleaseDate')}
            currentValue={mediaMetadata.releaseDate}
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
            borderColorClass="border-gray-600"
            labelClass="ps-2 text-base font-semibold"
          />
        )}

        <div className="flex items-center justify-end py-2">
          <Btn color="bg-success" type="submit" disabled={isPendingApply} loading={isPendingApply}>
            {t('ButtonSubmit')}
          </Btn>
        </div>
      </form>
    </div>
  )
}
