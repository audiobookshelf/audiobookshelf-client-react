'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { Chapter } from '@/types/api'
import { useCallback } from 'react'
import ChapterList from './ChapterList'

interface PlayerFullscreenChapterPanelProps {
  chapters: Chapter[]
  currentChapterId: number
  playbackRate: number
  isOpen: boolean
  /** Pure black instead of the translucent elevated surface */
  amoled?: boolean
  onSeek: (time: number) => void
  onClose: () => void
}

/**
 * Chapters docked beside the artwork instead of over it. Desktop only: it needs horizontal
 * room the phone layouts do not have, and it exists because a modal covering the artwork is
 * the wrong trade when the window is wide enough to show both at once.
 *
 * The rows are {@link ChapterList} — the same component the chapters modal renders — so this
 * is a different container for one list, not a second chapters UI.
 */
export default function PlayerFullscreenChapterPanel({
  chapters,
  currentChapterId,
  playbackRate,
  isOpen,
  amoled = false,
  onSeek,
  onClose
}: PlayerFullscreenChapterPanelProps) {
  const t = useTypeSafeTranslations()

  const handleSeek = useCallback(
    (time: number) => {
      onSeek(time)
      onClose()
    },
    [onClose, onSeek]
  )

  return (
    <div
      className={mergeClasses(
        'border-border flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl',
        amoled ? 'bg-black' : 'bg-primary/95 backdrop-blur-md'
      )}
    >
      <div className="border-border flex shrink-0 items-center border-b px-5 py-4">
        <p className="text-foreground-muted text-sm tracking-widest uppercase">{t('HeaderChapters')}</p>
        <div className="grow" />
        <IconBtn size="small" borderless onClick={onClose} ariaLabel={t('ButtonClose')}>
          close
        </IconBtn>
      </div>

      <ChapterList
        chapters={chapters}
        currentChapterId={currentChapterId}
        playbackRate={playbackRate}
        onSeek={handleSeek}
        isVisible={isOpen}
        emptyMessage={t('MessageNoChapters')}
        className="grow"
      />
    </div>
  )
}
