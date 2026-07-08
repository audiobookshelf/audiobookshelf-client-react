'use client'

import AddToCollectionModal from '@/components/modals/AddToCollectionModal'
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal'
import BatchQuickMatchModal from '@/components/modals/BatchQuickMatchModal'
import type { PlaylistItemPayload } from '@/types/api'
import type { SelectionKind } from '@/lib/selectedMediaItem'

export interface AppBarBatchActionModalsProps {
  libraryId?: string
  libraryItemIds: string[]
  playlistItems: PlaylistItemPayload[]
  playlistSelectionKind: SelectionKind
  collectionsModalOpen: boolean
  playlistsModalOpen: boolean
  quickMatchModalOpen: boolean
  onCloseCollectionsModal: () => void
  onClosePlaylistsModal: () => void
  onCloseQuickMatchModal: () => void
  onQuickMatchSuccess: () => void
}

export default function AppBarBatchActionModals({
  libraryId,
  libraryItemIds,
  playlistItems,
  playlistSelectionKind,
  collectionsModalOpen,
  playlistsModalOpen,
  quickMatchModalOpen,
  onCloseCollectionsModal,
  onClosePlaylistsModal,
  onCloseQuickMatchModal,
  onQuickMatchSuccess
}: AppBarBatchActionModalsProps) {
  return (
    <>
      {libraryId && (
        <AddToCollectionModal isOpen={collectionsModalOpen} onClose={onCloseCollectionsModal} libraryId={libraryId} libraryItemIds={libraryItemIds} />
      )}
      {libraryId && (
        <AddToPlaylistModal
          isOpen={playlistsModalOpen}
          onClose={onClosePlaylistsModal}
          libraryId={libraryId}
          items={playlistItems}
          selectionKind={playlistSelectionKind}
        />
      )}
      <BatchQuickMatchModal isOpen={quickMatchModalOpen} onClose={onCloseQuickMatchModal} libraryItemIds={libraryItemIds} onSuccess={onQuickMatchSuccess} />
    </>
  )
}
