import type { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { bytesPretty } from '@/lib/string'
import { durationPrettyShort } from '@/lib/timeUtils'
import type { LibraryItem } from '@/types/api'

export interface SortLineContext {
  libraryItem: LibraryItem
  media: LibraryItem['media']
  dateFormat: string
  timeFormat: string
  locale: string
  lastUpdated: number | null
  startedAt: number | null
  finishedAt: number | null
  t: ReturnType<typeof useTypeSafeTranslations>
}

export function formatSortLine(orderBy: string, context: SortLineContext): string | null {
  const { libraryItem, media, dateFormat, timeFormat, locale, lastUpdated, startedAt, finishedAt, t } = context

  if (orderBy === 'mtimeMs') {
    return t('LabelFileModifiedDate', { 0: formatJsDate(new Date(libraryItem.mtimeMs), dateFormat) })
  }
  if (orderBy === 'birthtimeMs') {
    return t('LabelFileBornDate', { 0: formatJsDate(new Date(libraryItem.birthtimeMs), dateFormat) })
  }
  if (orderBy === 'addedAt') {
    return t('LabelAddedDate', { 0: formatJsDate(new Date(libraryItem.addedAt), dateFormat) })
  }
  if (orderBy === 'media.duration') {
    const duration = (media as { duration?: number }).duration ?? 0
    return `${t('LabelDuration')}: ${durationPrettyShort(duration, locale)}`
  }
  if (orderBy === 'media.numTracks') {
    // For podcasts, the sort key is 'media.numTracks' but the actual field is 'numEpisodes'
    const numEpisodes = (media as { numEpisodes?: number }).numEpisodes ?? 0
    return `${numEpisodes} ${t('LabelEpisodes')}`
  }
  if (orderBy === 'size') {
    return `${t('LabelSize')}: ${bytesPretty(libraryItem.size ?? 0)}`
  }
  if (orderBy === 'progress' && lastUpdated) {
    return t('LabelLastProgressDate', {
      0: formatJsDate(new Date(lastUpdated), `${dateFormat} ${timeFormat}`)
    })
  }
  if (orderBy === 'progress.createdAt' && startedAt) {
    return t('LabelStartedDate', {
      0: formatJsDate(new Date(startedAt), `${dateFormat} ${timeFormat}`)
    })
  }
  if (orderBy === 'progress.finishedAt' && finishedAt) {
    return t('LabelFinishedDate', {
      0: formatJsDate(new Date(finishedAt), `${dateFormat} ${timeFormat}`)
    })
  }
  if (orderBy === 'media.metadata.publishedYear') {
    const publishedYear = (media.metadata as { publishedYear?: string | number }).publishedYear
    if (publishedYear) {
      return t('LabelPublishedDate', { 0: String(publishedYear) })
    }
  }

  return null
}
