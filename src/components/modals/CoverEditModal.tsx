'use client'

import Modal from '@/components/modals/Modal'
import CoverEdit from '@/components/widgets/CoverEdit'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, PodcastLibraryItem, User } from '@/types/api'

interface CoverEditModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: BookLibraryItem | PodcastLibraryItem
  user: User
  bookCoverAspectRatio: number
}

export default function CoverEditModal({ isOpen, onClose, libraryItem, user, bookCoverAspectRatio }: CoverEditModalProps) {
  const t = useTypeSafeTranslations()

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[calc(100%-4rem)] overflow-hidden flex flex-col">
      <div className="flex flex-col h-full bg-bg rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">{t('LabelEditCover')}</h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <CoverEdit libraryItem={libraryItem} user={user} bookCoverAspectRatio={bookCoverAspectRatio} />
        </div>
      </div>
    </Modal>
  )
}
