'use client'

import LibraryItemModal, { type LibraryItemModalItemSource, type UnsavedChangesLeaveHandle, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Match from '@/components/widgets/Match'
import { useLibrary } from '@/contexts/LibraryContext'
import { useMemo, type Ref } from 'react'

export type MatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & LibraryItemModalItemSource

export type MatchModalBodyProps = {
  fillParent?: boolean
  /** Lets the parent intercept leave (section change, hub back, close) while a match is selected but not yet applied. */
  closeRequestRef?: Ref<UnsavedChangesLeaveHandle | null>
}

export function MatchModalBody({ fillParent = false, closeRequestRef }: MatchModalBodyProps) {
  const { resolvedItem, fetchPending } = useLibraryItemModal()
  const { filterData } = useLibrary()

  // Existing library values offered in the match field dropdowns (same source as the Details tab).
  const availableNarrators = useMemo(() => (filterData?.narrators || []).map((n) => ({ value: n, content: n })), [filterData?.narrators])
  const availableGenres = useMemo(() => (filterData?.genres || []).map((g) => ({ value: g, content: g })), [filterData?.genres])
  const availableTags = useMemo(() => (filterData?.tags || []).map((tag) => ({ value: tag, content: tag })), [filterData?.tags])
  const availableSeries = useMemo(() => (filterData?.series || []).map((s) => ({ value: s.id, content: s.name })), [filterData?.series])

  return (
    <div className={fillParent ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'flex h-[80vh] flex-col overflow-hidden'}>
      {fetchPending && !resolvedItem ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingIndicator variant="inline" />
        </div>
      ) : resolvedItem ? (
        <Match
          libraryItem={resolvedItem}
          availableNarrators={availableNarrators}
          availableGenres={availableGenres}
          availableTags={availableTags}
          availableSeries={availableSeries}
          closeRequestRef={closeRequestRef}
        />
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
