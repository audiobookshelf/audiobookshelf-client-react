'use client'

import Modal from '@/components/modals/Modal'
import CoverEdit from '@/components/widgets/CoverEdit'
import type { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useMemo } from 'react'

export interface CoverEditModalProps {
  isOpen: boolean
  libraryItem: BookLibraryItem | PodcastLibraryItem
  onClose: () => void
}

export default function CoverEditModal({ isOpen, libraryItem, onClose }: CoverEditModalProps) {
  const mediaTitle = libraryItem.media.metadata.title ?? ''

  const outerContent = useMemo(() => {
    if (!mediaTitle) return undefined
    return (
      <div className="absolute start-0 top-0 p-4">
        <h2 className="max-w-[calc(100vw-4rem)] truncate text-xl text-white" title={mediaTitle}>
          {mediaTitle}
        </h2>
      </div>
    )
  }, [mediaTitle])

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent}>
      <div className="max-h-[85vh] overflow-y-auto">
        <CoverEdit libraryItem={libraryItem} />
      </div>
    </Modal>
  )
}
