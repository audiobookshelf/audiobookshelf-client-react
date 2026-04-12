'use client'

import LibraryItemModal, { type LibraryItemModalItemSource, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Match from '@/components/widgets/Match'

export type MatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & LibraryItemModalItemSource

function MatchModalBody() {
  const { resolvedItem, fetchPending } = useLibraryItemModal()
  return (
    <div className="flex h-[80vh] flex-col overflow-hidden">
      {fetchPending && !resolvedItem ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingIndicator variant="inline" />
        </div>
      ) : resolvedItem ? (
        <Match libraryItem={resolvedItem} />
      ) : null}
    </div>
  )
}

export default function MatchModal(props: MatchModalProps) {
  const { isOpen, onClose } = props
  const navCtxMode = 'navCtx' in props

  return (
    <LibraryItemModal
      isOpen={isOpen}
      onClose={onClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem })}
      className="md:max-w-[min(90vw,56rem)] lg:max-w-[min(90vw,56rem)]"
    >
      <MatchModalBody />
    </LibraryItemModal>
  )
}
