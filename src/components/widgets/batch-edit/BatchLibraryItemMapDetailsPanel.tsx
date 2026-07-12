'use client'

import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import MultiSelect, { type MultiSelectItem } from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import TwoStageMultiSelect from '@/components/ui/TwoStageMultiSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { Author, BookMetadata, LibraryItem, Series } from '@/types/api'
import { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'

export type MapDetailsType = 'overwrite' | 'append'

const APPENDABLE_KEYS = ['authors', 'genres', 'tags', 'narrators', 'series'] as const
type AppendableKey = (typeof APPENDABLE_KEYS)[number]

type BatchFieldKey = 'subtitle' | 'authors' | 'publishedYear' | 'series' | 'genres' | 'tags' | 'narrators' | 'publisher' | 'language' | 'explicit' | 'abridged'

type BatchUsage = Record<BatchFieldKey, boolean>

type BatchDetailsState = {
  subtitle: string
  authors: MultiSelectItem<string>[]
  publishedYear: string
  series: MultiSelectItem<{ value: string; modifier: string }>[]
  genres: MultiSelectItem<string>[]
  tags: MultiSelectItem<string>[]
  narrators: MultiSelectItem<string>[]
  publisher: string
  language: string
  explicit: boolean
  abridged: boolean
}

export type LibraryItemBatchMapPayload = Partial<{
  subtitle: string
  authors: Author[]
  publishedYear: string
  series: Series[]
  genres: string[]
  tags: string[]
  narrators: string[]
  publisher: string
  language: string
  explicit: boolean
  abridged: boolean
}>

const EMPTY_USAGE: BatchUsage = {
  subtitle: false,
  authors: false,
  publishedYear: false,
  series: false,
  genres: false,
  tags: false,
  narrators: false,
  publisher: false,
  language: false,
  explicit: false,
  abridged: false
}

const EMPTY_DETAILS: BatchDetailsState = {
  subtitle: '',
  authors: [],
  publishedYear: '',
  series: [],
  genres: [],
  tags: [],
  narrators: [],
  publisher: '',
  language: '',
  explicit: false,
  abridged: false
}

const MAP_FIELD_ROW_CLASS = 'flex min-h-18 w-full items-center gap-4 px-4 sm:w-1/2 [&>:first-child]:shrink-0'
const MAP_FIELD_LANGUAGE_FLAGS_ROW_CLASS = 'flex w-full flex-col gap-0 px-4 sm:min-h-18 sm:w-full sm:flex-row sm:items-start sm:gap-4'
const MAP_FIELD_LANGUAGE_FIELD_CLASS = 'flex min-h-18 min-w-0 w-full items-center gap-4 sm:w-1/2 sm:flex-none [&>:first-child]:shrink-0'
const MAP_FIELD_FLAGS_HALF_CLASS =
  'flex min-w-0 w-full flex-col items-stretch gap-0 sm:mt-6 sm:h-10 sm:w-1/2 sm:flex-none sm:flex-row sm:flex-nowrap sm:items-center sm:gap-4'
const MAP_FIELD_CHECKBOX_PAIR_CLASS = 'flex min-h-18 min-w-0 w-full items-center gap-4 sm:min-h-0 sm:flex-1 [&>:first-child]:shrink-0'
const MAP_FIELD_INPUT_CLASS = 'mb-5 min-w-0 flex-1'

interface BatchLibraryItemMapDetailsPanelProps {
  isPodcast: boolean
  libraryItems: LibraryItem[]
  availableAuthors: MultiSelectItem<string>[]
  availableNarrators: MultiSelectItem<string>[]
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  availableSeries: MultiSelectItem<string>[]
  onApply: (payload: LibraryItemBatchMapPayload, mapType: MapDetailsType) => void
  onHasSelectedUsageChange?: (hasSelected: boolean) => void
  disabled?: boolean
  ref?: React.Ref<BatchLibraryItemMapDetailsPanelRef>
}

export type BatchLibraryItemMapDetailsPanelRef = {
  populateFromExisting: (libraryItemId?: string) => void
  hasSelectedUsage: () => boolean
}

function seriesNameItemsToSeriesObjects(
  items: MultiSelectItem<{ value: string; modifier: string }>[],
  existingSeries: { id: string; name: string }[]
): Series[] {
  return items.map((item) => {
    const existing = existingSeries.find((se) => se.name.toLowerCase() === item.content.value.toLowerCase().trim())
    if (existing) {
      return { id: existing.id, name: existing.name, sequence: item.content.modifier || undefined }
    }
    return {
      id: `new-${Math.floor(Math.random() * 10000)}`,
      name: item.content.value,
      sequence: item.content.modifier || undefined
    }
  })
}

export default function BatchLibraryItemMapDetailsPanel({
  isPodcast,
  libraryItems,
  availableAuthors,
  availableNarrators,
  availableGenres,
  availableTags,
  availableSeries,
  onApply,
  onHasSelectedUsageChange,
  disabled = false,
  ref
}: BatchLibraryItemMapDetailsPanelProps) {
  const t = useTypeSafeTranslations()
  const [open, setOpen] = useState(true)
  const [mapType, setMapType] = useState<MapDetailsType>('overwrite')
  const [usage, setUsage] = useState<BatchUsage>({ ...EMPTY_USAGE })
  const [details, setDetails] = useState<BatchDetailsState>({ ...EMPTY_DETAILS })

  const isAppend = mapType === 'append'
  const hasSelectedUsage = useMemo(() => Object.values(usage).some(Boolean), [usage])

  useEffect(() => {
    onHasSelectedUsageChange?.(hasSelectedUsage)
  }, [hasSelectedUsage, onHasSelectedUsageChange])

  const setUsageField = useCallback((field: BatchFieldKey, value: boolean) => {
    setUsage((prev) => ({ ...prev, [field]: value }))
  }, [])

  const resetMapDetails = useCallback(() => {
    setUsage({ ...EMPTY_USAGE })
    setDetails({ ...EMPTY_DETAILS })
  }, [])

  const populateFromExisting = useCallback(
    (libraryItemId?: string) => {
      const itemsToMap = libraryItemId ? libraryItems.filter((li) => li.id === libraryItemId) : libraryItems

      setDetails((prev) => {
        const next = { ...prev }

        for (const key of Object.keys(usage) as BatchFieldKey[]) {
          if (!usage[key]) continue
          if (isAppend && !APPENDABLE_KEYS.includes(key as AppendableKey)) continue

          if (key === 'tags') {
            const merged = new Set<string>()
            itemsToMap.forEach((li) => li.media.tags?.forEach((tag) => merged.add(tag)))
            next.tags = Array.from(merged).map((tag) => ({ value: tag, content: tag }))
          } else if (key === 'authors') {
            const merged: Author[] = []
            itemsToMap.forEach((li) => {
              const authors = (li.media.metadata as BookMetadata).authors || []
              authors.forEach((au) => {
                if (!merged.some((m) => m.id === au.id)) merged.push({ ...au })
              })
            })
            next.authors = merged.map((au) => ({ value: au.id, content: au.name }))
          } else if (key === 'series') {
            const merged = new Set<string>()
            itemsToMap.forEach((li) => {
              const series = (li.media.metadata as BookMetadata).series
              const seriesList = Array.isArray(series) ? series : []
              seriesList.forEach((se) => merged.add(se.name))
            })
            next.series = Array.from(merged).map((name) => ({
              value: `populate-${name}`,
              content: { value: name, modifier: '' }
            }))
          } else if (key === 'genres' || key === 'narrators') {
            const merged = new Set<string>()
            itemsToMap.forEach((li) => {
              const values = ((li.media.metadata as BookMetadata)[key] as string[]) || []
              values.forEach((v) => merged.add(v))
            })
            next[key] = Array.from(merged).map((v) => ({ value: v, content: v }))
          } else if (key === 'explicit' || key === 'abridged') {
            const first = itemsToMap[0]
            if (first) {
              next[key] = Boolean((first.media.metadata as BookMetadata)[key])
            }
          } else {
            const first = itemsToMap[0]
            if (first) {
              const value = (first.media.metadata as BookMetadata)[key as keyof BookMetadata]
              if (typeof value === 'string') {
                next[key as 'subtitle' | 'publishedYear' | 'publisher' | 'language'] = value
              }
            }
          }
        }

        return next
      })
    },
    [isAppend, libraryItems, usage]
  )

  const handleApply = useCallback(() => {
    const payload: LibraryItemBatchMapPayload = {}

    for (const key of Object.keys(usage) as BatchFieldKey[]) {
      if (!usage[key]) continue
      if (isAppend && !APPENDABLE_KEYS.includes(key as AppendableKey)) continue

      switch (key) {
        case 'subtitle':
        case 'publishedYear':
        case 'publisher':
        case 'language':
          payload[key] = details[key]
          break
        case 'explicit':
        case 'abridged':
          payload[key] = details[key]
          break
        case 'authors':
          payload.authors = details.authors.map((au) => ({ id: au.value, name: au.content }))
          break
        case 'series':
          payload.series = seriesNameItemsToSeriesObjects(
            details.series,
            availableSeries.map((s) => ({ id: s.value, name: s.content as string }))
          )
          break
        case 'genres':
          payload.genres = details.genres.map((g) => g.content)
          break
        case 'tags':
          payload.tags = details.tags.map((tag) => tag.content)
          break
        case 'narrators':
          payload.narrators = details.narrators.map((n) => n.content)
          break
      }
    }

    onApply(payload, mapType)
  }, [availableSeries, details, isAppend, mapType, onApply, usage])

  useImperativeHandle(
    ref,
    () => ({
      populateFromExisting,
      hasSelectedUsage: () => hasSelectedUsage
    }),
    [hasSelectedUsage, populateFromExisting]
  )

  const fieldDisabled = (field: BatchFieldKey) => disabled || !usage[field]

  return (
    <div className="border-foreground/15 mx-auto mt-5 mb-10 max-w-7xl border">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          className="text-foreground-muted flex w-full min-w-0 cursor-pointer items-center text-start sm:flex-1"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="material-symbols shrink-0 text-2xl">{open ? 'expand_less' : 'expand_more'}</span>
          <p className="ms-4 min-w-0 text-lg">{t('HeaderMapDetails')}</p>
        </button>
        <div className="flex w-full max-w-xs shrink-0 sm:w-64 sm:max-w-none">
          <button
            type="button"
            className={mergeClasses(
              'border-foreground/20 h-8 flex-1 rounded-s-md border shadow-md sm:w-32 sm:flex-none',
              mapType !== 'overwrite' ? 'bg-bg text-foreground/30' : 'bg-primary text-foreground'
            )}
            onClick={() => setMapType('overwrite')}
          >
            <p className="text-sm">{t('LabelOverwrite')}</p>
          </button>
          <button
            type="button"
            className={mergeClasses(
              'border-foreground/20 h-8 flex-1 rounded-e-md border shadow-md sm:w-32 sm:flex-none',
              mapType !== 'append' ? 'bg-bg text-foreground/30' : 'bg-primary text-foreground'
            )}
            onClick={() => setMapType('append')}
          >
            <p className="text-sm">{t('LabelAppend')}</p>
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-wrap">
          {!isPodcast && !isAppend && (
            <div className={MAP_FIELD_ROW_CLASS}>
              <Checkbox value={usage.subtitle} onChange={(v) => setUsageField('subtitle', v)} disabled={disabled} />
              <TextInput
                value={details.subtitle}
                onChange={(v) => setDetails((d) => ({ ...d, subtitle: v }))}
                disabled={fieldDisabled('subtitle')}
                label={t('LabelSubtitle')}
                className={MAP_FIELD_INPUT_CLASS}
              />
            </div>
          )}

          {!isPodcast && (
            <div className={MAP_FIELD_ROW_CLASS}>
              <Checkbox value={usage.authors} onChange={(v) => setUsageField('authors', v)} disabled={disabled} />
              <div className={MAP_FIELD_INPUT_CLASS}>
                <MultiSelect
                  selectedItems={details.authors}
                  onItemAdded={(item) => setDetails((d) => ({ ...d, authors: [...d.authors, item] }))}
                  onItemRemoved={(item) => setDetails((d) => ({ ...d, authors: d.authors.filter((a) => a.value !== item.value) }))}
                  disabled={fieldDisabled('authors')}
                  label={t('LabelAuthors')}
                  items={availableAuthors}
                  allowNew
                />
              </div>
            </div>
          )}

          {!isPodcast && !isAppend && (
            <div className={MAP_FIELD_ROW_CLASS}>
              <Checkbox value={usage.publishedYear} onChange={(v) => setUsageField('publishedYear', v)} disabled={disabled} />
              <TextInput
                value={details.publishedYear}
                onChange={(v) => setDetails((d) => ({ ...d, publishedYear: v }))}
                disabled={fieldDisabled('publishedYear')}
                label={t('LabelPublishYear')}
                className={MAP_FIELD_INPUT_CLASS}
              />
            </div>
          )}

          {!isPodcast && (
            <div className={MAP_FIELD_ROW_CLASS}>
              <Checkbox value={usage.series} onChange={(v) => setUsageField('series', v)} disabled={disabled} />
              <div className={MAP_FIELD_INPUT_CLASS}>
                <TwoStageMultiSelect
                  label={t('LabelSeries')}
                  items={availableSeries.map((item) => ({ value: item.value, content: item.content as string }))}
                  selectedItems={details.series}
                  onItemAdded={(item) => setDetails((d) => ({ ...d, series: [...d.series, item] }))}
                  onItemRemoved={(item) => setDetails((d) => ({ ...d, series: d.series.filter((s) => s.value !== item.value) }))}
                  onItemEdited={(item, index) =>
                    setDetails((d) => {
                      const next = [...d.series]
                      next[index] = item
                      return { ...d, series: next }
                    })
                  }
                  disabled={fieldDisabled('series')}
                />
              </div>
            </div>
          )}

          <div className={MAP_FIELD_ROW_CLASS}>
            <Checkbox value={usage.genres} onChange={(v) => setUsageField('genres', v)} disabled={disabled} />
            <div className={MAP_FIELD_INPUT_CLASS}>
              <MultiSelect
                selectedItems={details.genres}
                onItemAdded={(item) => setDetails((d) => ({ ...d, genres: [...d.genres, item] }))}
                onItemRemoved={(item) => setDetails((d) => ({ ...d, genres: d.genres.filter((g) => g.value !== item.value) }))}
                disabled={fieldDisabled('genres')}
                label={t('LabelGenres')}
                items={availableGenres}
                allowNew
              />
            </div>
          </div>

          <div className={MAP_FIELD_ROW_CLASS}>
            <Checkbox value={usage.tags} onChange={(v) => setUsageField('tags', v)} disabled={disabled} />
            <div className={MAP_FIELD_INPUT_CLASS}>
              <MultiSelect
                selectedItems={details.tags}
                onItemAdded={(item) => setDetails((d) => ({ ...d, tags: [...d.tags, item] }))}
                onItemRemoved={(item) => setDetails((d) => ({ ...d, tags: d.tags.filter((tag) => tag.value !== item.value) }))}
                disabled={fieldDisabled('tags')}
                label={t('LabelTags')}
                items={availableTags}
                allowNew
              />
            </div>
          </div>

          {!isPodcast && (
            <div className={MAP_FIELD_ROW_CLASS}>
              <Checkbox value={usage.narrators} onChange={(v) => setUsageField('narrators', v)} disabled={disabled} />
              <div className={MAP_FIELD_INPUT_CLASS}>
                <MultiSelect
                  selectedItems={details.narrators}
                  onItemAdded={(item) => setDetails((d) => ({ ...d, narrators: [...d.narrators, item] }))}
                  onItemRemoved={(item) => setDetails((d) => ({ ...d, narrators: d.narrators.filter((n) => n.value !== item.value) }))}
                  disabled={fieldDisabled('narrators')}
                  label={t('LabelNarrators')}
                  items={availableNarrators}
                  allowNew
                />
              </div>
            </div>
          )}

          {!isPodcast && !isAppend && (
            <div className={MAP_FIELD_ROW_CLASS}>
              <Checkbox value={usage.publisher} onChange={(v) => setUsageField('publisher', v)} disabled={disabled} />
              <TextInput
                value={details.publisher}
                onChange={(v) => setDetails((d) => ({ ...d, publisher: v }))}
                disabled={fieldDisabled('publisher')}
                label={t('LabelPublisher')}
                className={MAP_FIELD_INPUT_CLASS}
              />
            </div>
          )}

          {!isAppend && (
            <div className={MAP_FIELD_LANGUAGE_FLAGS_ROW_CLASS}>
              <div className={MAP_FIELD_LANGUAGE_FIELD_CLASS}>
                <Checkbox value={usage.language} onChange={(v) => setUsageField('language', v)} disabled={disabled} />
                <TextInput
                  value={details.language}
                  onChange={(v) => setDetails((d) => ({ ...d, language: v }))}
                  disabled={fieldDisabled('language')}
                  label={t('LabelLanguage')}
                  className={MAP_FIELD_INPUT_CLASS}
                />
              </div>
              <div className={MAP_FIELD_FLAGS_HALF_CLASS}>
                <div className={MAP_FIELD_CHECKBOX_PAIR_CLASS}>
                  <Checkbox value={usage.explicit} onChange={(v) => setUsageField('explicit', v)} disabled={disabled} />
                  <div className="flex min-w-0 flex-1 items-center">
                    <Checkbox
                      value={details.explicit}
                      onChange={(v) => setDetails((d) => ({ ...d, explicit: v }))}
                      label={t('LabelExplicit')}
                      disabled={fieldDisabled('explicit')}
                      checkboxBgClass={fieldDisabled('explicit') ? 'bg-bg' : 'bg-primary'}
                      checkColorClass={fieldDisabled('explicit') ? 'text-foreground-subdued' : 'text-green-500'}
                      borderColorClass="border-foreground-subdued"
                      labelClass={fieldDisabled('explicit') ? 'ps-2 text-base font-semibold text-foreground/40' : 'ps-2 text-base font-semibold'}
                    />
                  </div>
                </div>
                {!isPodcast && (
                  <div className={MAP_FIELD_CHECKBOX_PAIR_CLASS}>
                    <Checkbox value={usage.abridged} onChange={(v) => setUsageField('abridged', v)} disabled={disabled} />
                    <div className="flex min-w-0 flex-1 items-center">
                      <Checkbox
                        value={details.abridged}
                        onChange={(v) => setDetails((d) => ({ ...d, abridged: v }))}
                        label={t('LabelAbridged')}
                        disabled={fieldDisabled('abridged')}
                        checkboxBgClass={fieldDisabled('abridged') ? 'bg-bg' : 'bg-primary'}
                        checkColorClass={fieldDisabled('abridged') ? 'text-foreground-subdued' : 'text-green-500'}
                        borderColorClass="border-foreground-subdued"
                        labelClass={fieldDisabled('abridged') ? 'ps-2 text-base font-semibold text-foreground/40' : 'ps-2 text-base font-semibold'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-2">
            <Btn size="small" className="w-full sm:w-auto" onClick={resetMapDetails} disabled={disabled}>
              {t('ButtonReset')}
            </Btn>
            <Tooltip text={t('MessageBatchEditPopulateMapDetailsAllHelp')} position="bottom" className="w-full sm:w-auto">
              <Btn size="small" className="w-full sm:w-auto" disabled={disabled || !hasSelectedUsage} onClick={() => populateFromExisting()}>
                {t('ButtonBatchEditPopulateFromExisting')}
              </Btn>
            </Tooltip>
            <div className="hidden grow sm:block" />
            <Btn color="bg-success" size="small" disabled={disabled || !hasSelectedUsage} className="w-full px-8 text-base sm:w-auto" onClick={handleApply}>
              {t('ButtonApply')}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
