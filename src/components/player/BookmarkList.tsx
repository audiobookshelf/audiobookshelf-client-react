'use client'

import { createBookmarkAction, removeBookmarkAction } from '@/app/actions/playbackActions'
import BookmarkItem from '@/components/player/BookmarkItem'
import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime, secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { AudioBookmark } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface BookmarkListProps {
  bookmarks: AudioBookmark[]
  currentTime: number
  libraryItemId: string
  playbackRate: number
  /** Clears the draft title whenever the surface reappears */
  isVisible: boolean
  onSelect: (bookmark: AudioBookmark) => void
  /** Called after a bookmark is picked, so a modal can dismiss itself */
  onAfterSelect?: () => void
  hideCreate?: boolean
  className?: string
  listClassName?: string
}

/**
 * The one bookmarks list in the app: the rows, the empty state and the add form. The modal
 * and the fullscreen player's docked panel both render this, so the two are the same feature
 * in two containers rather than two features that look alike.
 */
export default function BookmarkList({
  bookmarks,
  currentTime,
  libraryItemId,
  playbackRate,
  isVisible,
  onSelect,
  onAfterSelect,
  hideCreate = false,
  className,
  listClassName
}: BookmarkListProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { serverSettings } = useUser()
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('')

  useEffect(() => {
    if (isVisible) {
      setNewBookmarkTitle('')
    }
  }, [isVisible])

  const roundedCurrentTime = Math.round(currentTime)
  const canCreateBookmark = useMemo(() => !bookmarks.some((bm) => bm.time === roundedCurrentTime), [bookmarks, roundedCurrentTime])

  const sortedBookmarks = useMemo(() => [...bookmarks].sort((a, b) => a.time - b.time), [bookmarks])

  const handleSelect = useCallback(
    (bookmark: AudioBookmark) => {
      onSelect(bookmark)
      onAfterSelect?.()
    },
    [onAfterSelect, onSelect]
  )

  const handleDelete = useCallback(
    async (bookmark: AudioBookmark) => {
      try {
        await removeBookmarkAction(libraryItemId, bookmark.time)
        showToast(t('ToastBookmarkRemoveSuccess'), { type: 'success' })
      } catch (error) {
        console.error('[BookmarkList] Failed to remove bookmark:', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      }
    },
    [libraryItemId, showToast, t]
  )

  const submitCreateBookmark = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      let title = newBookmarkTitle.trim()
      if (!title) {
        title = formatJsDatetime(new Date(), serverSettings.dateFormat, serverSettings.timeFormat)
      }

      try {
        await createBookmarkAction(libraryItemId, {
          title,
          time: roundedCurrentTime
        })
        showToast(t('ToastBookmarkCreateSuccess'), { type: 'success' })
        setNewBookmarkTitle('')
      } catch (error) {
        console.error('[BookmarkList] Failed to create bookmark:', error)
        showToast(t('ToastBookmarkCreateFailed'), { type: 'error' })
      }
    },
    [roundedCurrentTime, libraryItemId, newBookmarkTitle, serverSettings.dateFormat, serverSettings.timeFormat, showToast, t]
  )

  return (
    <div className={mergeClasses('flex flex-col', className)}>
      {sortedBookmarks.length > 0 ? (
        <div className={mergeClasses('w-full overflow-x-hidden overflow-y-auto', listClassName)}>
          {sortedBookmarks.map((bookmark) => (
            <BookmarkItem
              key={`${bookmark.libraryItemId}-${bookmark.time}`}
              bookmark={bookmark}
              highlight={roundedCurrentTime === bookmark.time}
              playbackRate={playbackRate}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-32 grow items-center justify-center">
          <p className="text-lg">{t('MessageNoBookmarks')}</p>
        </div>
      )}

      {canCreateBookmark && !hideCreate && (
        <div className="border-border w-full shrink-0 border-t">
          <form onSubmit={submitCreateBookmark}>
            <div className="border-border text-foreground-muted flex items-center border-b px-4 py-2 text-center">
              <div className="w-16 max-w-16 shrink-0 text-center">
                <p className="text-foreground-muted font-mono text-sm">{secondsToTimestamp(roundedCurrentTime / playbackRate)}</p>
              </div>
              <div className="grow px-2">
                <TextInput value={newBookmarkTitle} placeholder={t('PlaceholderBookmarkNote')} onChange={setNewBookmarkTitle} className="w-full" />
              </div>
              <Btn type="submit" className="px-4">
                {t('ButtonAdd')}
              </Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
