'use client'

import LibraryItemModal, { type LibraryItemModalItemSource, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import CoverEdit from '@/components/widgets/CoverEdit'

export type CoverEditModalProps = {
  isOpen: boolean
  onClose: () => void
} & LibraryItemModalItemSource

type CoverEditModalBodyProps = {
  /** When true (navCtx), body height stays fixed so prev/next does not resize the panel. */
  stableBodyHeight: boolean
}

function CoverEditModalBody({ stableBodyHeight }: CoverEditModalBodyProps) {
  const { resolvedItem, fetchPending } = useLibraryItemModal()
  const showLoading = fetchPending && !resolvedItem

  if (stableBodyHeight) {
    return (
      <div className="flex h-[min(40rem,85vh)] max-h-[85vh] w-full flex-col overflow-hidden rounded-lg">
        {showLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingIndicator variant="inline" />
          </div>
        ) : resolvedItem ? (
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <CoverEdit libraryItem={resolvedItem} />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {showLoading ? (
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
    <LibraryItemModal isOpen={isOpen} onClose={onClose} {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem })}>
      <CoverEditModalBody stableBodyHeight={navCtxMode} />
    </LibraryItemModal>
  )
}
