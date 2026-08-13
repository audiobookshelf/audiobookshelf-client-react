'use client'

import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { Chapter } from '@/types/api'
import { memo, useCallback, useEffect, useRef } from 'react'

interface ChapterRowProps {
  chapter: Chapter
  isCurrentChapter: boolean
  isListened: boolean
  playbackRate: number
  onSeek: (time: number) => void
}

const ChapterRow = memo(function ChapterRow({ chapter, isCurrentChapter, isListened, playbackRate, onSeek }: ChapterRowProps) {
  // Scaled by rate to match every other timestamp the player shows
  const startTimestamp = secondsToTimestamp(chapter.start / playbackRate)
  const duration = Math.max(0, chapter.end - chapter.start)
  const durationTimestamp = secondsToTimestamp(duration / playbackRate)

  const handleClick = useCallback(() => {
    onSeek(chapter.start)
  }, [onSeek, chapter.start])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSeek(chapter.start)
      }
    },
    [onSeek, chapter.start]
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={mergeClasses(
        'relative flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left',
        'hover:bg-primary/10 focus:outline-none',
        isListened && !isCurrentChapter && 'bg-foreground-muted/5',
        isCurrentChapter && 'bg-foreground-muted/10'
      )}
      data-current={isCurrentChapter}
    >
      <div
        className={mergeClasses(
          'absolute start-0 top-0 h-full w-1',
          isListened && !isCurrentChapter && 'bg-success/40',
          isCurrentChapter && 'bg-success rounded-bl-full'
        )}
      ></div>

      {/* Chapter number indicator */}
      <div
        className={mergeClasses(
          'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm leading-none font-medium',
          isCurrentChapter ? 'bg-foreground-muted/20 text-foreground' : 'bg-foreground-muted/10 text-foreground-muted'
        )}
      >
        {chapter.id + 1}
      </div>

      {/* Chapter info */}
      <div className="min-w-0 flex-1">
        <p dir="auto" className="text-foreground truncate text-sm font-medium">
          {chapter.title}
        </p>
        <div className="text-foreground-muted mt-0.5 flex items-center gap-1.5 text-xs">
          <span className="font-mono">{startTimestamp}</span>
          <span className="text-foreground-muted/60 font-mono">({durationTimestamp})</span>
        </div>
      </div>
    </button>
  )
})

interface ChapterListProps {
  chapters: Chapter[]
  currentChapterId: number
  playbackRate: number
  onSeek: (time: number) => void
  /** Re-centres the playing chapter when this flips to true */
  isVisible: boolean
  emptyMessage: string
  className?: string
}

/**
 * The one chapter list in the app. Both the chapters modal and the fullscreen player's
 * docked panel render this, so the two can never drift into looking like different
 * features — only their container differs.
 */
export default function ChapterList({ chapters, currentChapterId, playbackRate, onSeek, isVisible, emptyMessage, className }: ChapterListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Centre the playing chapter on open and whenever playback moves on to the next one
  useEffect(() => {
    if (!isVisible || !listRef.current) return

    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector('[data-current="true"]')?.scrollIntoView({ behavior: 'instant', block: 'center' })
    })

    return () => cancelAnimationFrame(frame)
  }, [isVisible, currentChapterId])

  return (
    <div ref={listRef} className={mergeClasses('h-full w-full overflow-x-hidden overflow-y-auto', className)}>
      {chapters.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-lg">{emptyMessage}</p>
        </div>
      ) : (
        chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            isCurrentChapter={chapter.id === currentChapterId}
            isListened={chapter.id < currentChapterId}
            playbackRate={playbackRate}
            onSeek={onSeek}
          />
        ))
      )}
    </div>
  )
}
