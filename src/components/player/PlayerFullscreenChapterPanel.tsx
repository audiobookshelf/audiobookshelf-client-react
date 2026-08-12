'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { Chapter } from '@/types/api'
import { useEffect, useRef } from 'react'

interface PlayerFullscreenChapterPanelProps {
  chapters: Chapter[]
  currentChapterId: number | null
  playbackRate: number
  onSelect: (chapter: Chapter) => void
  onClose: () => void
}

export default function PlayerFullscreenChapterPanel({ chapters, currentChapterId, playbackRate, onSelect, onClose }: PlayerFullscreenChapterPanelProps) {
  const t = useTypeSafeTranslations()
  const listRef = useRef<HTMLDivElement>(null)
  const currentRowRef = useRef<HTMLButtonElement>(null)

  // Center the playing chapter whenever the panel opens or playback moves on
  useEffect(() => {
    const list = listRef.current
    const row = currentRowRef.current
    if (!list || !row) return

    list.scrollTo({ top: row.offsetTop - list.clientHeight / 2 })
  }, [currentChapterId])

  return (
    <div className="border-border bg-primary/95 flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl">
      <div className="border-border flex shrink-0 items-center border-b px-5 py-4">
        <p className="text-foreground-muted text-sm tracking-widest uppercase">{t('LabelChapters')}</p>
        <div className="grow" />
        <IconBtn size="small" borderless onClick={onClose} ariaLabel={t('ButtonClose')}>
          close
        </IconBtn>
      </div>

      <div ref={listRef} className="grow overflow-y-auto px-2 py-2">
        {chapters.map((chapter) => {
          const isCurrent = chapter.id === currentChapterId

          return (
            <button
              key={chapter.id}
              ref={isCurrent ? currentRowRef : undefined}
              type="button"
              aria-current={isCurrent}
              className={mergeClasses(
                'relative flex w-full cursor-pointer items-center rounded-lg px-3 py-3 text-start',
                isCurrent ? 'bg-warning/20 hover:bg-warning/10' : 'hover:bg-bg-hover'
              )}
              onClick={() => onSelect(chapter)}
            >
              <span className="truncate pe-2 text-sm">{chapter.title}</span>
              <span className="grow" />
              <span className="text-foreground-subdued font-mono text-xs whitespace-nowrap">{secondsToTimestamp(chapter.start / playbackRate)}</span>
              {isCurrent && <span className="bg-warning absolute start-0 top-1/2 h-3/5 w-1 -translate-y-1/2 rounded-full" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
