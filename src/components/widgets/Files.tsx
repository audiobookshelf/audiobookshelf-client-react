'use client'

import { useModalRef } from '@/contexts/ModalContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, PodcastLibraryItem, User } from '@/types/api'
import LibraryFilesTable from './LibraryFilesTable'

interface FilesProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  user: User
}

/**
 * Files tab container component
 *
 * Displays the library files table for a library item.
 * Detects if rendered within a modal using ModalContext and adjusts behavior accordingly.
 */
export default function Files({ libraryItem, user }: FilesProps) {
  const t = useTypeSafeTranslations()
  const modalRef = useModalRef()
  const inModal = !!modalRef

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden px-4 py-6" role="region" aria-label={t('HeaderLibraryFiles')}>
      <div className="w-full">
        <LibraryFilesTable libraryItem={libraryItem} user={user} keepOpen={inModal} inModal={inModal} expanded />
      </div>
    </div>
  )
}
