'use client'

import { updateBookmarkAction } from '@/app/actions/playbackActions'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { AudioBookmark } from '@/types/api'
import { useCallback, useState } from 'react'

interface BookmarkItemProps {
  bookmark: AudioBookmark
  highlight: boolean
  playbackRate: number
  onSelect: (bookmark: AudioBookmark) => void
  onDelete: (bookmark: AudioBookmark) => void
}

export default function BookmarkItem({ bookmark, highlight, playbackRate, onSelect, onDelete }: BookmarkItemProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isEditing, setIsEditing] = useState(false)
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('')

  const displayTimestamp = secondsToTimestamp(bookmark.time / playbackRate)

  const handleSelect = useCallback(() => {
    if (isEditing) return
    onSelect(bookmark)
  }, [bookmark, isEditing, onSelect])

  const handleEditClick = useCallback(() => {
    setNewBookmarkTitle(bookmark.title)
    setIsEditing(true)
  }, [bookmark.title])

  const handleDeleteClick = useCallback(() => {
    onDelete(bookmark)
  }, [bookmark, onDelete])

  const stopRowSelect = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setNewBookmarkTitle('')
  }, [])

  const submitUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (newBookmarkTitle === bookmark.title) {
        cancelEditing()
        return
      }

      try {
        await updateBookmarkAction(bookmark.libraryItemId, {
          time: bookmark.time,
          title: newBookmarkTitle
        })
        setIsEditing(false)
      } catch (error) {
        console.error('[BookmarkItem] Failed to update bookmark:', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    },
    [bookmark.libraryItemId, bookmark.time, bookmark.title, cancelEditing, newBookmarkTitle, showToast, t]
  )

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelect()
      }
    },
    [handleSelect]
  )

  return (
    <>
      {isEditing ? (
        <form onSubmit={submitUpdate} className={mergeClasses('flex w-full min-w-0 items-center gap-2 px-4 py-3', highlight && 'bg-foreground-muted/10')}>
          <div className="w-16 max-w-16 shrink-0 text-center">
            <p className="text-foreground-muted font-mono text-sm">{displayTimestamp}</p>
          </div>
          <div className="min-w-0 flex-1">
            <TextInput value={newBookmarkTitle} placeholder="Note" onChange={setNewBookmarkTitle} className="w-full" />
          </div>
          <Btn type="submit" className="shrink-0 px-4">
            {t('ButtonSave')}
          </Btn>
          <IconBtn
            borderless
            className="text-foreground-muted hover:text-foreground shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              cancelEditing()
            }}
            ariaLabel={t('ButtonCancel')}
          >
            close
          </IconBtn>
        </form>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleSelect}
          onKeyDown={handleRowKeyDown}
          className={mergeClasses('flex cursor-pointer items-center gap-1 px-4 py-3', highlight && 'bg-foreground-muted/10', 'hover:bg-primary/10')}
        >
          <div className="w-16 max-w-16 shrink-0 text-center">
            <p className="text-foreground-muted font-mono text-sm">{displayTimestamp}</p>
          </div>
          <p className="min-w-0 flex-1 truncate px-2">{bookmark.title}</p>
          <div className="flex shrink-0 items-center" onClick={stopRowSelect} onKeyDown={stopRowSelect}>
            <IconBtn borderless size="small" className="text-foreground-muted" onClick={handleEditClick} ariaLabel={t('ButtonEdit')}>
              edit
            </IconBtn>
            <IconBtn
              borderless
              size="small"
              className="text-foreground-muted hover:not-disabled:text-error"
              onClick={handleDeleteClick}
              ariaLabel={t('ButtonDelete')}
            >
              delete
            </IconBtn>
          </div>
        </div>
      )}
    </>
  )
}
