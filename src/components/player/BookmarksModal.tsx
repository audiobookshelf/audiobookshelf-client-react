'use client'

import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { AudioBookmark } from '@/types/api'
import BookmarkList from './BookmarkList'

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

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('LabelYourBookmarks')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="overflow-hidden sm:max-w-[600px] md:max-w-[600px] lg:max-w-[600px]">
      <BookmarkList
        bookmarks={bookmarks}
        currentTime={currentTime}
        libraryItemId={libraryItemId}
        playbackRate={playbackRate}
        isVisible={isOpen}
        onSelect={onSelect}
        onAfterSelect={onClose}
        hideCreate={hideCreate}
        className="max-h-[80vh]"
        listClassName="max-h-[calc(80vh-60px)]"
      />
    </Modal>
  )
}
