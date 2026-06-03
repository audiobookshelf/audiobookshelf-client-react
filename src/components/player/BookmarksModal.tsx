'use client'

import { createBookmarkAction, removeBookmarkAction } from '@/app/actions/playbackActions'
import Modal from '@/components/modals/Modal'
import BookmarkItem from '@/components/player/BookmarkItem'
import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime, secondsToTimestamp } from '@/lib/datefns'
import type { AudioBookmark } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface BookmarksModalProps {
  isOpen: boolean
  bookmarks: AudioBookmark[]
  currentTime: number
  libraryItemId: string
  playbackRate: number
  onClose: () => void
  onSelect: (bookmark: AudioBookmark) => void
  hideCreate?: boolean
}

export default function BookmarksModal({
  isOpen,
  bookmarks,
  currentTime,
  libraryItemId,
  playbackRate,
  onClose,
  onSelect,
  hideCreate = false
}: BookmarksModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { serverSettings } = useUser()
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNewBookmarkTitle('')
    }
  }, [isOpen])

  const roundedCurrentTime = Math.round(currentTime)
  const canCreateBookmark = useMemo(() => !bookmarks.some((bm) => bm.time === roundedCurrentTime), [bookmarks, roundedCurrentTime])

  const sortedBookmarks = useMemo(() => [...bookmarks].sort((a, b) => a.time - b.time), [bookmarks])

  const handleSelect = useCallback(
    (bookmark: AudioBookmark) => {
      onSelect(bookmark)
      onClose()
    },
    [onClose, onSelect]
  )

  const handleDelete = useCallback(
    async (bookmark: AudioBookmark) => {
      try {
        await removeBookmarkAction(libraryItemId, bookmark.time)
        showToast(t('ToastBookmarkRemoveSuccess'), { type: 'success' })
      } catch (error) {
        console.error('[BookmarksModal] Failed to remove bookmark:', error)
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
        console.error('[BookmarksModal] Failed to create bookmark:', error)
        showToast(t('ToastBookmarkCreateFailed'), { type: 'error' })
      }
    },
    [roundedCurrentTime, libraryItemId, newBookmarkTitle, serverSettings.dateFormat, serverSettings.timeFormat, showToast, t]
  )

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('LabelYourBookmarks')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="overflow-hidden sm:max-w-[600px] md:max-w-[600px] lg:max-w-[600px]">
      <div className="flex max-h-[80vh] flex-col">
        {sortedBookmarks.length > 0 ? (
          <div className="max-h-[calc(80vh-60px)] w-full overflow-x-hidden overflow-y-auto">
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
          <div className="flex h-32 items-center justify-center">
            <p className="text-lg">{t('MessageNoBookmarks')}</p>
          </div>
        )}

        {canCreateBookmark && !hideCreate && (
          <div className="border-border w-full border-t">
            <form onSubmit={submitCreateBookmark}>
              <div className="border-border text-foreground-muted flex items-center border-b px-4 py-2 text-center">
                <div className="w-16 max-w-16 shrink-0 text-center">
                  <p className="text-foreground-muted font-mono text-sm">{secondsToTimestamp(roundedCurrentTime / playbackRate)}</p>
                </div>
                <div className="grow px-2">
                  <TextInput value={newBookmarkTitle} placeholder="Note" onChange={setNewBookmarkTitle} className="w-full" />
                </div>
                <Btn type="submit" className="px-4">
                  {t('ButtonAdd')}
                </Btn>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}
