'use client'

import { DetailRow } from '@/components/details/DetailRow'
import { MetadataCheckboxField } from '@/components/details/MetadataCheckboxField'
import { MetadataMultiSelectField } from '@/components/details/MetadataMultiSelectField'
import { MetadataTextField } from '@/components/details/MetadataTextField'
import IconBtn from '@/components/ui/IconBtn'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import Tooltip from '@/components/ui/Tooltip'
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
  | 'authors'
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
  | 'explicit'
  | 'abridged'

export const getPopulatedFields = (currentMetadata: BookMetadata, currentTags: string[] = []) => {
  const populated = new Set<string>()
  if (currentMetadata.subtitle) populated.add('subtitle')
  if (currentMetadata.authors?.length) populated.add('authors')
  if (currentMetadata.publisher) populated.add('publisher')
  if (currentMetadata.publishedYear) populated.add('publishedYear')
  if (currentMetadata.language) populated.add('language')
  if (currentMetadata.isbn) populated.add('isbn')
  if (currentMetadata.asin) populated.add('asin')
  if (currentMetadata.genres?.length) populated.add('genres')
  if (currentMetadata.narrators?.length) populated.add('narrators')
  if (currentMetadata.series?.length) populated.add('series')
  if (currentTags.length) populated.add('tags')
  if (currentMetadata.explicit) populated.add('explicit')
  if (currentMetadata.abridged) populated.add('abridged')

  // Description check
  const desc = currentMetadata.description
  if (desc && desc.trim() !== '' && desc.trim() !== '<p></p>' && desc.trim() !== '<p><br></p>') {
    populated.add('description')
  }

  return populated
}

export const getAvailableOptionalFields = (t: TypeSafeTranslations): { key: OptionalField; label: string }[] => [
  { key: 'subtitle', label: t('LabelSubtitle') },
  { key: 'authors', label: t('LabelAuthors') },
  { key: 'narrators', label: t('LabelNarrators') },
  { key: 'series', label: t('LabelSeries') },
  { key: 'publishedYear', label: t('LabelPublishYear') },
  { key: 'publisher', label: t('LabelPublisher') },
  { key: 'description', label: t('LabelDescription') },
  { key: 'genres', label: t('LabelGenres') },
  { key: 'tags', label: t('LabelTags') },
  { key: 'language', label: t('LabelLanguage') },
  { key: 'isbn', label: 'ISBN' },
  { key: 'asin', label: 'ASIN' },
  { key: 'explicit', label: t('LabelExplicit') },
  { key: 'abridged', label: t('LabelAbridged') }
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
  /** Page-level edit mode: false = view mode (read-only), true = edit mode */
  isPageEditMode?: boolean
  /** When true, open the title field in edit mode */
  titleInEditMode?: boolean
  /** User has update permission */
  userCanUpdate?: boolean
  /** Toggle page edit mode */
  onToggleEditMode?: () => void
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
  isPageEditMode,
  titleInEditMode,
  userCanUpdate,
  onToggleEditMode
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

  const isFieldVisible = (key: string) => isPageEditMode || visibleFields.has(key)

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 flex flex-col gap-1 pr-12">
          <BookTitle
            metadata={metadata}
            pageEditMode={isPageEditMode}
            openInEditMode={titleInEditMode}
            onSave={async (val) => {
              await onSave?.({ metadata: { title: val.title } })
            }}
          />

          {isFieldVisible('subtitle') && (
            <BookSubtitle
              value={metadata.subtitle}
              onSave={(val) => handleSaveField('subtitle', val)}
              onCancel={() => handleCancelField('subtitle')}
              pageEditMode={isPageEditMode}
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
          onCancel={() => handleCancelField('series')}
          pageEditMode={isPageEditMode}
        />
      )}

      {isFieldVisible('authors') && (
        <BookAuthors
          authors={metadata.authors || []}
          libraryId={libraryItem.libraryId}
          availableAuthors={availableAuthors}
          onSave={(val) => handleSaveField('authors', val)} // API expects Author[]
          onCancel={() => handleCancelField('authors')}
          pageEditMode={isPageEditMode}
        />
      )}

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
            onCancel={() => handleCancelField('narrators')}
            pageEditMode={isPageEditMode}
          />
        )}

        {/* Publish Year */}
        {isFieldVisible('publishedYear') && (
          <MetadataTextField
            label={t('LabelPublishYear')}
            value={metadata.publishedYear}
            onSave={(val) => handleSaveField('publishedYear', val)}
            type="number"
            onCancel={() => handleCancelField('publishedYear')}
            pageEditMode={isPageEditMode}
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
            onCancel={() => handleCancelField('publisher')}
            pageEditMode={isPageEditMode}
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
            onCancel={() => handleCancelField('genres')}
            pageEditMode={isPageEditMode}
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
            onCancel={() => handleCancelField('tags')}
            pageEditMode={isPageEditMode}
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
            onCancel={() => handleCancelField('language')}
            pageEditMode={isPageEditMode}
          />
        )}

        {/* ISBN */}
        {isFieldVisible('isbn') && (
          <MetadataTextField
            label="ISBN"
            value={metadata.isbn}
            onSave={(val) => handleSaveField('isbn', val)}
            onCancel={() => handleCancelField('isbn')}
            pageEditMode={isPageEditMode}
          />
        )}

        {/* ASIN */}
        {isFieldVisible('asin') && (
          <MetadataTextField
            label="ASIN"
            value={metadata.asin}
            onSave={(val) => handleSaveField('asin', val)}
            onCancel={() => handleCancelField('asin')}
            pageEditMode={isPageEditMode}
          />
        )}

        {/* Explicit */}
        {isFieldVisible('explicit') && (
          <MetadataCheckboxField
            label={t('LabelExplicit')}
            value={!!metadata.explicit}
            onSave={(val) => handleSaveField('explicit', val)}
            onCancel={() => handleCancelField('explicit')}
            pageEditMode={isPageEditMode}
          />
        )}

        {/* Abridged */}
        {isFieldVisible('abridged') && (
          <MetadataCheckboxField
            label={t('LabelAbridged')}
            value={!!metadata.abridged}
            onSave={(val) => handleSaveField('abridged', val)}
            onCancel={() => handleCancelField('abridged')}
            pageEditMode={isPageEditMode}
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
            onCancel={() => handleCancelField('description')}
            pageEditMode={isPageEditMode}
          />
        )}

        {/* Edit/View button - positioned absolutely at top right, but placed in DOM here for tab order */}
        {userCanUpdate && onToggleEditMode && (
          <Tooltip text={isPageEditMode ? t('ButtonView') : t('ButtonEdit')} position="top" className="absolute top-0 right-0">
            <IconBtn size="small" onClick={onToggleEditMode} ariaLabel={isPageEditMode ? t('ButtonView') : t('ButtonEdit')}>
              {isPageEditMode ? 'visibility' : 'edit'}
            </IconBtn>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
