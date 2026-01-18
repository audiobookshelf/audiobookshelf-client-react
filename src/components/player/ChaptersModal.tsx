'use client'

import Modal from '@/components/modals/Modal'
import type { UsePlayerHandlerReturn } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { Chapter } from '@/types/api'
import { memo, useCallback, useEffect, useRef } from 'react'

interface ChaptersModalProps {
  isOpen: boolean
  playerHandler: UsePlayerHandlerReturn
  onClose: () => void
}

interface ChapterRowProps {
  chapter: Chapter
  isCurrentChapter: boolean
  isListened: boolean
  onSeek: (time: number) => void
}

const ChapterRow = memo(function ChapterRow({ chapter, isCurrentChapter, isListened, onSeek }: ChapterRowProps) {
  const startTimestamp = secondsToTimestamp(chapter.start)
  const duration = Math.max(0, chapter.end - chapter.start)
  const durationTimestamp = secondsToTimestamp(duration)

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
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-lg',
        'hover:bg-foreground-muted/5 focus:bg-foreground-muted/5 focus:outline-none',
        isCurrentChapter && 'bg-accent/15 border-l-3 border-accent',
        isListened && !isCurrentChapter && 'bg-success/5'
      )}
      data-current={isCurrentChapter}
    >
      {/* Chapter number indicator */}
      <div
        className={mergeClasses(
          'w-8 h-8 rounded-full grid place-items-center text-sm font-medium leading-none shrink-0',
          isCurrentChapter ? 'bg-accent text-primary' : isListened ? 'bg-success/20 text-success' : 'bg-foreground-muted/10 text-foreground-muted'
        )}
      >
        {chapter.id + 1}
      </div>

      {/* Chapter info */}
      <div className="flex-1 min-w-0">
        <p
          dir="auto"
          className={mergeClasses('text-sm font-medium truncate', isCurrentChapter ? 'text-accent' : isListened ? 'text-foreground/80' : 'text-foreground')}
        >
          {chapter.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-foreground-muted">
          <span className="font-mono">{startTimestamp}</span>
          <span className="font-mono text-foreground-muted/60">({durationTimestamp})</span>
        </div>
      </div>
    </button>
  )
})

export default function ChaptersModal({ isOpen, playerHandler, onClose }: ChaptersModalProps) {
  const t = useTypeSafeTranslations()
  const listRef = useRef<HTMLDivElement>(null)

  const { chapters, currentChapter } = playerHandler.state
  const { seek } = playerHandler.controls

  // Scroll to current chapter when modal opens
  useEffect(() => {
    if (isOpen && listRef.current && currentChapter) {
      // Use requestAnimationFrame to ensure the modal is rendered
      requestAnimationFrame(() => {
        const currentElement = listRef.current?.querySelector('[data-current="true"]')
        if (currentElement) {
          currentElement.scrollIntoView({
            behavior: 'instant',
            block: 'center'
          })
        }
      })
    }
  }, [isOpen, currentChapter])

  const handleSeek = (time: number) => {
    seek(time)
  }

  const currentChapterId = currentChapter?.id ?? -1

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-lg md:max-w-lg lg:max-w-lg">
      <div className="flex flex-col max-h-[80vh]">
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {chapters.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-foreground-muted">
              <p>{t('MessageNoChapters')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {chapters.map((chapter) => {
                const isCurrentChapter = chapter.id === currentChapterId
                const isListened = chapter.id < currentChapterId

                return <ChapterRow key={chapter.id} chapter={chapter} isCurrentChapter={isCurrentChapter} isListened={isListened} onSeek={handleSeek} />
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
