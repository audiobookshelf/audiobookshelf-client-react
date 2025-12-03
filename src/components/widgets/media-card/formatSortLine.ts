import { formatJsDate } from '@/lib/datefns'
import type { LibraryItem } from '@/types/api'
import type { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export interface SortLineContext {
  libraryItem: LibraryItem
  media: LibraryItem['media']
  dateFormat: string
  timeFormat: string
  lastUpdated: number | null
  startedAt: number | null
  finishedAt: number | null
  t: ReturnType<typeof useTypeSafeTranslations>
}

export function formatSortLine(orderBy: string, context: SortLineContext): string | null {
  const { libraryItem, media, dateFormat, timeFormat, lastUpdated, startedAt, finishedAt, t } = context

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
    return `${t('LabelDuration')}: ${(media as { duration?: number }).duration ?? 0}s`
  }
  if (orderBy === 'size') {
    return `${t('LabelSize')}: ${(libraryItem.size ?? 0).toString()}`
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

  return null
}

