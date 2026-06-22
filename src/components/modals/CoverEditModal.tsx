'use client'

import LibraryItemModal, { type LibraryItemModalItemSource, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import CoverEdit from '@/components/widgets/CoverEdit'

export type CoverEditModalProps = {
  isOpen: boolean
  onClose: () => void
} & LibraryItemModalItemSource

function CoverEditModalBody() {
  const { resolvedItem, fetchPending } = useLibraryItemModal()

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {fetchPending && !resolvedItem ? (
        <div className="flex min-h-[24rem] items-center justify-center">
          <LoadingIndicator variant="inline" />
        </div>
      ) : resolvedItem ? (
        <CoverEdit libraryItem={resolvedItem} />
      ) : null}
    </div>
  )
}

/**
 * Modal for editing a library item cover.
 * Pass `navCtx` to load expanded items (e.g. from media cards); pass `libraryItem` when already expanded.
 */
export default function CoverEditModal(props: CoverEditModalProps) {
  const { isOpen, onClose } = props
  const navCtxMode = 'navCtx' in props

  return (
    <LibraryItemModal
      isOpen={isOpen}
      onClose={onClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem })}
    >
      <CoverEditModalBody />
    </LibraryItemModal>
  )
}
