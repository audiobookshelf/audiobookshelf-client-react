'use client'

import Modal from '@/components/modals/Modal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Match from '@/components/widgets/Match'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: BookLibraryItem | PodcastLibraryItem | null
  loading?: boolean
}

export default function MatchModal({ isOpen, onClose, libraryItem, loading = false }: MatchModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex h-[80vh] flex-col overflow-hidden">
        {loading && !libraryItem ? (
          <div className="relative min-h-0 flex-1">
            <LoadingIndicator label="LabelLoadingLibraryItem" />
          </div>
        ) : libraryItem ? (
          <Match libraryItem={libraryItem} />
        ) : null}
      </div>
    </Modal>
  )
}
