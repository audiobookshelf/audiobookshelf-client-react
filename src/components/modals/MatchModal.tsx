'use client'

import Modal from '@/components/modals/Modal'
import Match from '@/components/widgets/Match'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: BookLibraryItem | PodcastLibraryItem
  bookCoverAspectRatio: number
}

export default function MatchModal({ isOpen, onClose, libraryItem, bookCoverAspectRatio }: MatchModalProps) {
  const t = useTypeSafeTranslations()

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[calc(100%-4rem)] overflow-hidden flex flex-col">
      <div className="flex flex-col h-full bg-bg rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">{t('HeaderMatch')}</h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto bg-bg-elevated p-4">
          <Match libraryItem={libraryItem} bookCoverAspectRatio={bookCoverAspectRatio} isEnabled={isOpen} onClose={onClose} />
        </div>
      </div>
    </Modal>
  )
}
