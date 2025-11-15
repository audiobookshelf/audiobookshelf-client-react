'use client'

import { elapsedPretty } from '@/lib/formatElapsedTime'
import { bytesPretty } from '@/lib/string'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, BookMetadata, PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import { useLocale } from 'next-intl'
import { Fragment } from 'react'

interface LibraryItemDetailsProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
}

interface DetailRowProps {
  label: string
  value: string | string[] | undefined
  filterKey?: string
  libraryId?: string
}

const encode = (text: string) => encodeURIComponent(Buffer.from(text).toString('base64'))

function DetailRow({ label, value, filterKey, libraryId }: DetailRowProps) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null

  let displayValue = null
  if (filterKey) {
    // Create library filter links
    if (Array.isArray(value)) {
      displayValue = (value as string[]).map((v, index) => (
        <Fragment key={v}>
          <a href={`/library/${libraryId}/bookshelf?filter=${filterKey}.${encode(v)}`} className="text-foreground hover:underline">
            {v}
          </a>
          {index < (value as string[]).length - 1 && <span className="text-foreground">, </span>}
        </Fragment>
      ))
    } else {
      displayValue = (
        <a href={`/library/${libraryId}/bookshelf?filter=${filterKey}.${encode(value)}`} className="text-foreground hover:underline">
          {value}
        </a>
      )
    }
  } else {
    displayValue = Array.isArray(value) ? value.join(', ') : value
  }

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
          <DetailRow label={t('LabelNarrators')} value={bookMetadata.narrators} filterKey="narrators" libraryId={libraryItem.libraryId} />
          <DetailRow label={t('LabelPublishYear')} value={bookMetadata.publishedYear} />
          <DetailRow label={t('LabelPublisher')} value={bookMetadata.publisher} filterKey="publishers" libraryId={libraryItem.libraryId} />
        </>
      )}

      {/* Podcast-specific fields */}
      {isPodcast && podcastMetadata && <DetailRow label={t('LabelPodcastType')} value={podcastMetadata.type} />}

      {/* Common fields */}
      <DetailRow label={t('LabelGenres')} value={metadata.genres} filterKey="genres" libraryId={libraryItem.libraryId} />
      <DetailRow label={t('LabelTags')} value={libraryItem.media.tags} filterKey="tags" libraryId={libraryItem.libraryId} />
      <DetailRow label={t('LabelLanguage')} value={metadata.language} filterKey="languages" libraryId={libraryItem.libraryId} />
      <DetailRow label={t('LabelDuration')} value={elapsedPretty(duration || 0, locale || 'en-us')} />
      <DetailRow label={t('LabelSize')} value={bytesPretty(size)} />
    </div>
  )
}
