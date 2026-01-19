'use client'

import { DetailRow } from '@/components/details/DetailRow'
import { MetadataMultiSelectField } from '@/components/details/MetadataMultiSelectField'
import { MetadataTextField } from '@/components/details/MetadataTextField'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { bytesPretty } from '@/lib/string'
import { elapsedPretty } from '@/lib/timeUtils'
import { BookLibraryItem, BookMetadata } from '@/types/api'
import { TypeSafeTranslations } from '@/types/translations'
import { useLocale } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { BookAuthors } from './details/BookAuthors'
import { BookSeries } from './details/BookSeries'
import { BookSubtitle } from './details/BookSubtitle'
import { BookTitle } from './details/BookTitle'
import { ItemDescription } from './details/ItemDescription'

type Details = Omit<BookMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'publishedDate'>

// --- Field Visibility Logic (Add Field) ---
// Fields that are considered "optional" and can be added via the dropdown
export type OptionalField =
  | 'subtitle'
  | 'publisher'
  | 'publishedYear'
  | 'language'
  | 'isbn'
  | 'asin'
  | 'genres'
  | 'tags'
  | 'narrators'
  | 'series'
  | 'description'

export const getPopulatedFields = (currentMetadata: BookMetadata, currentTags: string[] = []) => {
  const populated = new Set<string>()
  if (currentMetadata.subtitle) populated.add('subtitle')
  if (currentMetadata.publisher) populated.add('publisher')
  if (currentMetadata.publishedYear) populated.add('publishedYear')
  if (currentMetadata.language) populated.add('language')
  if (currentMetadata.isbn) populated.add('isbn')
  if (currentMetadata.asin) populated.add('asin')
  if (currentMetadata.genres?.length) populated.add('genres')
  if (currentMetadata.narrators?.length) populated.add('narrators')
  if (currentMetadata.series?.length) populated.add('series')
  if (currentTags.length) populated.add('tags')

  // Description check
  const desc = currentMetadata.description
  if (desc && desc.trim() !== '' && desc.trim() !== '<p></p>' && desc.trim() !== '<p><br></p>') {
    populated.add('description')
  }

  return populated
}

export const getAvailableOptionalFields = (t: TypeSafeTranslations): { key: OptionalField; label: string }[] => [
  { key: 'subtitle', label: t('LabelSubtitle') },
  { key: 'narrators', label: t('LabelNarrators') },
  { key: 'series', label: t('LabelSeries') },
  { key: 'publishedYear', label: t('LabelPublishYear') },
  { key: 'publisher', label: t('LabelPublisher') },
  { key: 'description', label: t('LabelDescription') },
  { key: 'genres', label: t('LabelGenres') },
  { key: 'tags', label: t('LabelTags') },
  { key: 'language', label: t('LabelLanguage') },
  { key: 'isbn', label: 'ISBN' },
  { key: 'asin', label: 'ASIN' }
]

interface BookDetailsSectionProps {
  libraryItem: BookLibraryItem
  availableAuthors: MultiSelectItem<string>[]
  availableNarrators: MultiSelectItem<string>[]
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  availableSeries: MultiSelectItem<string>[]
  onSave?: (updatePayload: { metadata?: Partial<Details>; tags?: string[] }) => Promise<void>

  visibleFields: Set<string>
  setVisibleFields: (fields: Set<string>) => void
  fieldToAutoEdit: string | null
}

/**
 * Book details section with inline view/edit capabilities.
 *
 * View Mode: Displays metadata with clickable links for authors/series
 * Edit Mode: Fields transform to inline inputs/multi-selects via EditableField
 */
export default function BookDetailsSection({
  libraryItem,
  availableAuthors = [],
  availableNarrators = [],
  availableGenres = [],
  availableTags = [],
  availableSeries = [],
  onSave,
  visibleFields,
  setVisibleFields,
  fieldToAutoEdit
}: BookDetailsSectionProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()

  const media = useMemo(() => libraryItem.media || {}, [libraryItem.media])
  const metadata = useMemo(() => (media.metadata || {}) as BookMetadata, [media.metadata])

  // Calculate Duration/Size
  const duration = media.duration || 0
  const size = media.size || 0

  // Helper to check if a value is empty (including empty HTML)
  const isValueEmpty = (key: string, value: unknown, tags: string[]) => {
    if (key === 'tags') return !tags || tags.length === 0
    if (key === 'description') {
      if (!value || typeof value !== 'string') return true
      const trimmed = value.trim()
      return trimmed === '' || trimmed === '<p></p>' || trimmed === '<p><br></p>'
    }
    return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
  }

  const handleSaveField = useCallback(
    async <K extends keyof Details>(key: K, value: Details[K]) => {
      await onSave?.({ metadata: { [key]: value } })

      // Check if value is empty and hide field if so (only for optional fields)
      if (isValueEmpty(key as string, value, [])) {
        setVisibleFields(new Set([...visibleFields].filter((k) => k !== key)))
      }
    },
    [onSave, visibleFields, setVisibleFields]
  )

  const handleSaveTags = useCallback(
    async (tags: string[]) => {
      await onSave?.({ tags })
      if (!tags || tags.length === 0) {
        setVisibleFields(new Set([...visibleFields].filter((k) => k !== 'tags')))
      }
    },
    [onSave, visibleFields, setVisibleFields]
  )

  const handleCancelField = useCallback(
    (key: OptionalField) => {
      // Check if value is empty in metadata and hide field if so
      let isEmpty = false
      if (key === 'tags') {
        isEmpty = isValueEmpty('tags', null, media.tags)
      } else {
        const value = metadata[key]
        isEmpty = isValueEmpty(key, value, [])
      }

      if (isEmpty) {
        setVisibleFields(new Set([...visibleFields].filter((k) => k !== key)))
      }
    },
    [metadata, media.tags, visibleFields, setVisibleFields]
  )

  const isFieldVisible = (key: string) => visibleFields.has(key)

  return (
    <div className="w-full">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 flex flex-col gap-1">
          <BookTitle
            metadata={metadata}
            onSave={async (val) => {
              await onSave?.({ metadata: { title: val.title, explicit: val.explicit, abridged: val.abridged } })
            }}
          />

          {isFieldVisible('subtitle') && (
            <BookSubtitle
              value={metadata.subtitle}
              onSave={(val) => handleSaveField('subtitle', val)}
              openInEditMode={fieldToAutoEdit === 'subtitle'}
              onCancel={() => handleCancelField('subtitle')}
            />
          )}
        </div>
      </div>

      {isFieldVisible('series') && (
        <BookSeries
          series={metadata.series || []}
          libraryId={libraryItem.libraryId}
          availableSeries={availableSeries}
          onSave={(val) => handleSaveField('series', val)}
          openInEditMode={fieldToAutoEdit === 'series'}
          onCancel={() => handleCancelField('series')}
        />
      )}

      <BookAuthors
        authors={metadata.authors || []}
        libraryId={libraryItem.libraryId}
        availableAuthors={availableAuthors}
        onSave={(val) => handleSaveField('authors', val)} // API expects Author[]
      />

      {/* Details Grid */}
      <div className="mt-6 flex flex-col">
        {/* Narrators */}
        {isFieldVisible('narrators') && (
          <MetadataMultiSelectField
            label={t('LabelNarrators')}
            items={metadata.narrators || []}
            availableItems={availableNarrators}
            libraryId={libraryItem.libraryId}
            filterKey="narrators"
            onSave={(val) => handleSaveField('narrators', val)}
            openInEditMode={fieldToAutoEdit === 'narrators'}
            onCancel={() => handleCancelField('narrators')}
          />
        )}

        {/* Publish Year */}
        {isFieldVisible('publishedYear') && (
          <MetadataTextField
            label={t('LabelPublishYear')}
            value={metadata.publishedYear}
            onSave={(val) => handleSaveField('publishedYear', val)}
            type="number"
            openInEditMode={fieldToAutoEdit === 'publishedYear'}
            onCancel={() => handleCancelField('publishedYear')}
          />
        )}

        {/* Publisher */}
        {isFieldVisible('publisher') && (
          <MetadataTextField
            label={t('LabelPublisher')}
            value={metadata.publisher}
            onSave={(val) => handleSaveField('publisher', val)}
            libraryId={libraryItem.libraryId}
            filterKey="publishers"
            openInEditMode={fieldToAutoEdit === 'publisher'}
            onCancel={() => handleCancelField('publisher')}
          />
        )}

        {/* Genres */}
        {isFieldVisible('genres') && (
          <MetadataMultiSelectField
            label={t('LabelGenres')}
            items={metadata.genres || []}
            availableItems={availableGenres}
            libraryId={libraryItem.libraryId}
            filterKey="genres"
            onSave={(val) => handleSaveField('genres', val)}
            openInEditMode={fieldToAutoEdit === 'genres'}
            onCancel={() => handleCancelField('genres')}
          />
        )}

        {/* Tags */}
        {isFieldVisible('tags') && (
          <MetadataMultiSelectField
            label={t('LabelTags')}
            items={media.tags || []}
            availableItems={availableTags}
            libraryId={libraryItem.libraryId}
            filterKey="tags"
            onSave={handleSaveTags} // Special case for tags
            openInEditMode={fieldToAutoEdit === 'tags'}
            onCancel={() => handleCancelField('tags')}
          />
        )}

        {/* Language */}
        {isFieldVisible('language') && (
          <MetadataTextField
            label={t('LabelLanguage')}
            value={metadata.language}
            onSave={(val) => handleSaveField('language', val)}
            libraryId={libraryItem.libraryId}
            filterKey="languages"
            openInEditMode={fieldToAutoEdit === 'language'}
            onCancel={() => handleCancelField('language')}
          />
        )}

        {/* ISBN */}
        {isFieldVisible('isbn') && (
          <MetadataTextField
            label="ISBN"
            value={metadata.isbn}
            onSave={(val) => handleSaveField('isbn', val)}
            openInEditMode={fieldToAutoEdit === 'isbn'}
            onCancel={() => handleCancelField('isbn')}
          />
        )}

        {/* ASIN */}
        {isFieldVisible('asin') && (
          <MetadataTextField
            label="ASIN"
            value={metadata.asin}
            onSave={(val) => handleSaveField('asin', val)}
            openInEditMode={fieldToAutoEdit === 'asin'}
            onCancel={() => handleCancelField('asin')}
          />
        )}

        {/* Duration (Read Only) */}
        {<DetailRow label={t('LabelDuration')} value={<span suppressHydrationWarning>{elapsedPretty(duration, locale || 'en-us')}</span>} />}

        {/* Size (Read Only) */}
        {<DetailRow label={t('LabelSize')} value={<span suppressHydrationWarning>{bytesPretty(size)}</span>} />}

        {isFieldVisible('description') && (
          <ItemDescription
            description={metadata.description}
            onSave={(val) => handleSaveField('description', val)}
            openInEditMode={fieldToAutoEdit === 'description'}
            onCancel={() => handleCancelField('description')}
          />
        )}
      </div>
    </div>
  )
}
