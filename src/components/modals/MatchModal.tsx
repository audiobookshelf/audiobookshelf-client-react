'use client'

import Modal from '@/components/modals/Modal'
import Match from '@/components/widgets/Match'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: BookLibraryItem | PodcastLibraryItem
  bookCoverAspectRatio: number
}

export default function MatchModal({ isOpen, onClose, libraryItem, bookCoverAspectRatio }: MatchModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-[80vh]">
        <Match libraryItem={libraryItem} bookCoverAspectRatio={bookCoverAspectRatio} />
      </div>
    </Modal>
  )
}
