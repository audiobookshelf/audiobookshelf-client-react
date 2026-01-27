'use client'

import { DetailRow } from '@/components/details/DetailRow'
import { EditableField } from '@/components/details/EditableField'
import { MetadataCheckboxField } from '@/components/details/MetadataCheckboxField'
import { MetadataMultiSelectField } from '@/components/details/MetadataMultiSelectField'
import { MetadataTextField } from '@/components/details/MetadataTextField'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import IconBtn from '@/components/ui/IconBtn'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import Tooltip from '@/components/ui/Tooltip'
import { useItemPageEditMode } from '@/contexts/ItemPageEditModeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { bytesPretty } from '@/lib/string'
import { elapsedPretty } from '@/lib/timeUtils'
import { PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import { TypeSafeTranslations } from '@/types/translations'
import { useLocale } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { ItemDescription } from './details/ItemDescription'
import { PodcastAuthor } from './details/PodcastAuthor'
import { PodcastTitle } from './details/PodcastTitle'

type Details = Omit<PodcastMetadata, 'titleIgnorePrefix' | 'descriptionPlain' | 'imageUrl' | 'itunesPageUrl' | 'itunesArtistId'>

// --- Field Visibility Logic (Add Field) ---
export type OptionalField = 'feedUrl' | 'itunesId' | 'releaseDate' | 'language' | 'genres' | 'tags' | 'type' | 'description' | 'explicit'

export const getPopulatedFields = (currentMetadata: PodcastMetadata, currentTags: string[] = []) => {
  const populated = new Set<string>()
  if (currentMetadata.feedUrl) populated.add('feedUrl')
  if (currentMetadata.itunesId) populated.add('itunesId')
  if (currentMetadata.releaseDate) populated.add('releaseDate')
  if (currentMetadata.language) populated.add('language')
  if (currentMetadata.genres?.length) populated.add('genres')
  if (currentMetadata.type) populated.add('type')
  if (currentTags.length) populated.add('tags')
  if (currentMetadata.explicit) populated.add('explicit')

  // Description check
  const desc = currentMetadata.description
  if (desc && desc.trim() !== '' && desc.trim() !== '<p></p>' && desc.trim() !== '<p><br></p>') {
    populated.add('description')
  }

  return populated
}

export const getAvailableOptionalFields = (t: TypeSafeTranslations): { key: OptionalField; label: string }[] => [
  { key: 'feedUrl', label: t('LabelRSSFeedURL') },
  { key: 'itunesId', label: 'iTunes ID' },
  { key: 'releaseDate', label: t('LabelReleaseDate') },
  { key: 'language', label: t('LabelLanguage') },
  { key: 'genres', label: t('LabelGenres') },
  { key: 'tags', label: t('LabelTags') },
  { key: 'type', label: t('LabelPodcastType') },
  { key: 'description', label: t('LabelDescription') },
  { key: 'explicit', label: t('LabelExplicit') }
]

interface PodcastDetailsSectionProps {
  libraryItem: PodcastLibraryItem
  availableGenres: MultiSelectItem<string>[]
  availableTags: MultiSelectItem<string>[]
  onSave?: (updatePayload: { metadata?: Partial<Details>; tags?: string[] }) => Promise<void>

  visibleFields: Set<string>
  setVisibleFields: (fields: Set<string>) => void
  /** When true, open the title field in edit mode */
  titleInEditMode?: boolean
  /** User has update permission */
  userCanUpdate?: boolean
  /** Toggle page edit mode */
  onToggleEditMode?: () => void
}

/**
 * Podcast details section with inline view/edit capabilities.
 */
export default function PodcastDetailsSection({
  libraryItem,
  availableGenres = [],
  availableTags = [],
  onSave,
  visibleFields,
  setVisibleFields,
  titleInEditMode,
  userCanUpdate,
  onToggleEditMode
}: PodcastDetailsSectionProps) {
  const t = useTypeSafeTranslations()
  const { isPageEditMode } = useItemPageEditMode()
  const locale = useLocale()

  const media = useMemo(() => libraryItem.media || {}, [libraryItem.media])
  const metadata = useMemo(() => (media.metadata || {}) as PodcastMetadata, [media.metadata])

  // Calculate Duration/Size
  const duration = useMemo(() => {
    return media.episodes?.reduce((acc, episode) => acc + (episode.audioTrack?.duration || 0), 0) || 0
  }, [media.episodes])

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
        isEmpty = isValueEmpty('tags', null, media.tags || [])
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

  // Podcast type options
  const podcastTypeItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelEpisodic'), value: 'episodic' },
      { text: t('LabelSerial'), value: 'serial' }
    ],
    [t]
  )

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 flex flex-col gap-1 pr-12">
          <PodcastTitle
            metadata={metadata}
            openInEditMode={titleInEditMode}
            onSave={async (val) => {
              await onSave?.({ metadata: { title: val.title } })
            }}
          />

          <PodcastAuthor
            author={metadata.author}
            onSave={async (val) => {
              await onSave?.({ metadata: { author: val } })
            }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-6 flex flex-col gap-1">
        {/* Type */}
        {/* Type */}
        {isFieldVisible('type') && (
          <DetailRow label={t('LabelPodcastType')}>
            <EditableField
              value={metadata.type || 'episodic'}
              renderView={({ value }: { value: string }) => (
                <div className="min-w-[40px]">{podcastTypeItems.find((item) => item.value === value)?.text || value}</div>
              )}
              renderEdit={({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
                <div className="w-full md:w-auto">
                  <Dropdown
                    value={value}
                    items={podcastTypeItems}
                    onChange={(val) => {
                      onChange(String(val))
                    }}
                    className="w-full"
                    size="small"
                    autoFocus
                  />
                </div>
              )}
              onSave={(val) => handleSaveField('type', val)}
              onCancel={() => handleCancelField('type')}
            />
          </DetailRow>
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
            onSave={handleSaveTags} // Special case
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
            onCancel={() => handleCancelField('language')}
          />
        )}

        {/* Release Date */}
        {isFieldVisible('releaseDate') && (
          <MetadataTextField
            label={t('LabelReleaseDate')}
            value={metadata.releaseDate}
            onSave={(val) => handleSaveField('releaseDate', val)}
            onCancel={() => handleCancelField('releaseDate')}
          />
        )}

        {/* iTunes ID */}
        {isFieldVisible('itunesId') && (
          <MetadataTextField
            label="iTunes ID"
            value={metadata.itunesId}
            onSave={(val) => handleSaveField('itunesId', val)}
            onCancel={() => handleCancelField('itunesId')}
          />
        )}

        {/* Feed URL */}
        {isFieldVisible('feedUrl') && (
          <MetadataTextField
            label={t('LabelRSSFeedURL')}
            value={metadata.feedUrl}
            onSave={(val) => handleSaveField('feedUrl', val)}
            onCancel={() => handleCancelField('feedUrl')}
          />
        )}

        {/* Explicit */}
        {isFieldVisible('explicit') && (
          <MetadataCheckboxField
            label={t('LabelExplicit')}
            value={!!metadata.explicit}
            onSave={(val) => handleSaveField('explicit', val)}
            onCancel={() => handleCancelField('explicit')}
          />
        )}

        {/* Duration (Read Only) */}
        {<DetailRow label={t('LabelDuration')} value={<span suppressHydrationWarning>{elapsedPretty(duration, locale || 'en-us')}</span>} />}

        {/* Size (Read Only) */}
        {<DetailRow label={t('LabelSize')} value={<span suppressHydrationWarning>{bytesPretty(size)}</span>} />}

        {/* Description */}
        {isFieldVisible('description') && (
          <ItemDescription
            description={metadata.description}
            onSave={(val) => handleSaveField('description', val)}
            onCancel={() => handleCancelField('description')}
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
