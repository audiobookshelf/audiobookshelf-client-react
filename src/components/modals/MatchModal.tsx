'use client'

import LibraryItemModal, { type LibraryItemModalItemSource, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import { MetadataEditFooterProvider, useMetadataEditFooter } from '@/components/modals/MetadataEditFooterContext'
import ModalFooter from '@/components/modals/ModalFooter'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import EmbedMetadataFooterControl from '@/components/widgets/EmbedMetadataFooterControl'
import Match from '@/components/widgets/Match'
import { useMemo, useState, type ReactNode } from 'react'

export type MatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & LibraryItemModalItemSource

function MatchModalContent() {
  const { resolvedItem, fetchPending } = useLibraryItemModal()

  if (fetchPending && !resolvedItem) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingIndicator variant="inline" />
      </div>
    )
  }

  if (!resolvedItem) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Match libraryItem={resolvedItem} />
    </div>
  )
}

function MatchModalShell({ fillParent, children }: { fillParent?: boolean; children: ReactNode }) {
  return <div className={fillParent ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'flex h-[80vh] flex-col overflow-hidden'}>{children}</div>
}

export function MatchModalBody({ fillParent = false, onClose }: { fillParent?: boolean; onClose?: () => void }) {
  const { resolvedItem } = useLibraryItemModal()
  const parentFooter = useMetadataEditFooter()
  const [endContainer, setEndContainer] = useState<HTMLDivElement | null>(null)

  const footerApi = useMemo(
    () => ({
      endContainer
    }),
    [endContainer]
  )

  if (parentFooter) {
    return (
      <MatchModalShell fillParent={fillParent}>
        <MatchModalContent />
      </MatchModalShell>
    )
  }

  return (
    <MetadataEditFooterProvider value={footerApi}>
      <MatchModalShell fillParent={fillParent}>
        <MatchModalContent />
        {resolvedItem ? <ModalFooter start={<EmbedMetadataFooterControl libraryItem={resolvedItem} onClose={onClose} />} endSlotRef={setEndContainer} /> : null}
      </MatchModalShell>
    </MetadataEditFooterProvider>
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
      <MatchModalBody onClose={onClose} />
    </LibraryItemModal>
  )
}
