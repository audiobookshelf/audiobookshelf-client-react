'use client'

import Modal from '@/components/modals/Modal'
import type { PlayerHandler } from '@/hooks/usePlayerHandler'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { Chapter } from '@/types/api'
import { memo, useCallback, useEffect, useRef } from 'react'

interface ChaptersModalProps {
  isOpen: boolean
  playerHandler: PlayerHandler
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

  const handleSeek = useCallback(
    (time: number) => {
      seek(time)
      onClose()
    },
    [onClose, seek]
  )

  const currentChapterId = currentChapter?.id ?? -1

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderChapters')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="overflow-hidden sm:max-w-lg md:max-w-lg lg:max-w-lg">
      <div className="flex max-h-[80vh] flex-col">
        <div ref={listRef} className="h-full w-full overflow-x-hidden overflow-y-auto">
          {chapters.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-lg">{t('MessageNoChapters')}</p>
            </div>
          ) : (
            chapters.map((chapter) => {
              const isCurrentChapter = chapter.id === currentChapterId
              const isListened = chapter.id < currentChapterId

              return <ChapterRow key={chapter.id} chapter={chapter} isCurrentChapter={isCurrentChapter} isListened={isListened} onSeek={handleSeek} />
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
