'use client'

import { secondsToTimestamp } from '@/lib/datefns'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Chapter } from '@/types/api'

interface ChaptersPreviewTableProps {
  chapters: Chapter[]
}

export default function ChaptersPreviewTable({ chapters }: ChaptersPreviewTableProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="border-border bg-bg w-full border">
      <div className="bg-primary/25 flex px-4 py-2">
        <div className="text-foreground-muted grow text-xs font-semibold uppercase">{t('LabelChapterTitle')}</div>
        <div className="text-foreground-muted w-16 min-w-16 text-xs font-semibold uppercase">{t('LabelStart')}</div>
        <div className="text-foreground-muted w-16 min-w-16 text-xs font-semibold uppercase">{t('LabelEnd')}</div>
      </div>
      <div className="max-h-72 w-full overflow-auto">
        {!chapters.length ? (
          <p className="text-foreground-muted py-5 text-center">{t('MessageNoChapters')}</p>
        ) : (
          chapters.map((chapter, index) => (
            <div key={`${chapter.start}-${chapter.title}`} className={`flex px-4 py-1 text-sm ${index % 2 === 1 ? 'bg-primary/25' : ''}`}>
              <div className="grow font-semibold">{chapter.title}</div>
              <div className="w-16 min-w-16">{secondsToTimestamp(chapter.start)}</div>
              <div className="w-16 min-w-16">{secondsToTimestamp(chapter.end)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
