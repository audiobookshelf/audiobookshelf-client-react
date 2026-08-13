'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { AudioBookmark } from '@/types/api'
import { useCallback } from 'react'
import BookmarkList from './BookmarkList'

interface PlayerFullscreenBookmarksPanelProps {
  bookmarks: AudioBookmark[]
  currentTime: number
  libraryItemId: string
  playbackRate: number
  isOpen: boolean
  /** Pure black instead of the translucent elevated surface */
  amoled?: boolean
  onSelect: (bookmark: AudioBookmark) => void
  onClose: () => void
}

/**
 * Bookmarks docked beside the artwork, the mirror of the chapters panel — chapters slide in
 * from the end of the row, bookmarks from the start, so the two never fight for the same
 * space and each keeps a side of its own.
 *
 * The rows are {@link BookmarkList}, the same component the bookmarks modal renders.
 */
export default function PlayerFullscreenBookmarksPanel({
  bookmarks,
  currentTime,
  libraryItemId,
  playbackRate,
  isOpen,
  amoled = false,
  onSelect,
  onClose
}: PlayerFullscreenBookmarksPanelProps) {
  const t = useTypeSafeTranslations()

  const handleSelect = useCallback(
    (bookmark: AudioBookmark) => {
      onSelect(bookmark)
      onClose()
    },
    [onClose, onSelect]
  )

  return (
    <div
      className={mergeClasses(
        'border-border flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl',
        amoled ? 'bg-black' : 'bg-primary/95 backdrop-blur-md'
      )}
    >
      <div className="border-border flex shrink-0 items-center border-b px-5 py-4">
        <p className="text-foreground-muted text-sm tracking-widest uppercase">{t('LabelYourBookmarks')}</p>
        <div className="grow" />
        <IconBtn size="small" borderless onClick={onClose} ariaLabel={t('ButtonClose')}>
          close
        </IconBtn>
      </div>

      <BookmarkList
        bookmarks={bookmarks}
        currentTime={currentTime}
        libraryItemId={libraryItemId}
        playbackRate={playbackRate}
        isVisible={isOpen}
        onSelect={handleSelect}
        className="min-h-0 grow"
        listClassName="grow"
      />
    </div>
  )
}
