'use client'

import { elapsedPretty } from '@/lib/formatElapsedTime'
import { bytesPretty } from '@/lib/string'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, BookMetadata, PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import { useLocale } from 'next-intl'

interface LibraryItemDetailsProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
}

interface DetailRowProps {
  label: string
  value: string | string[] | undefined
}

function DetailRow({ label, value }: DetailRowProps) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null

  // TODO: Update to use links to library item filters, series pages, author pages
  const displayValue = Array.isArray(value) ? value.join(', ') : value

  return (
    <div className="flex">
      <div className="w-40 text-sm font-medium text-foreground-subdued uppercase">{label}</div>
      <div className="flex-1 text-base">{displayValue}</div>
    </div>
  )
}

function getLibraryItemDuration(libraryItem: BookLibraryItem | PodcastLibraryItem): number | undefined {
  if (libraryItem.mediaType === 'book') {
    return (libraryItem.media as BookLibraryItem['media']).duration
  } else if (libraryItem.mediaType === 'podcast') {
    return (libraryItem.media as PodcastLibraryItem['media']).episodes.reduce((acc, episode) => acc + (episode.audioTrack?.duration || 0), 0)
  }
  return undefined
}

export default function LibraryItemDetails({ libraryItem }: LibraryItemDetailsProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()

  const metadata = libraryItem.media.metadata
  const isBook = libraryItem.mediaType === 'book'
  const isPodcast = libraryItem.mediaType === 'podcast'

  const bookMetadata = isBook ? (metadata as BookMetadata) : null
  const podcastMetadata = isPodcast ? (metadata as PodcastMetadata) : null

  const duration = getLibraryItemDuration(libraryItem)
  const size = libraryItem.media.size || 0

  return (
    <div className="mt-6 flex flex-col gap-1">
      {/* Book-specific fields */}
      {isBook && bookMetadata && (
        <>
          <DetailRow label={t('LabelNarrators')} value={bookMetadata.narrators} />
          <DetailRow label={t('LabelPublishYear')} value={bookMetadata.publishedYear} />
          <DetailRow label={t('LabelPublisher')} value={bookMetadata.publisher} />
        </>
      )}

      {/* Podcast-specific fields */}
      {isPodcast && podcastMetadata && <DetailRow label={t('LabelPodcastType')} value={podcastMetadata.type} />}

      {/* Common fields */}
      <DetailRow label={t('LabelGenres')} value={metadata.genres} />
      <DetailRow label={t('LabelTags')} value={libraryItem.media.tags} />
      <DetailRow label={t('LabelLanguage')} value={metadata.language} />
      <DetailRow label={t('LabelDuration')} value={elapsedPretty(duration || 0, locale || 'en-us')} />
      <DetailRow label={t('LabelSize')} value={bytesPretty(size)} />
    </div>
  )
}
