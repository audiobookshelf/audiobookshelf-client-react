'use client'

import { type UnsavedChangesLeaveHandle, useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Match from '@/components/widgets/Match'
import { useLibrary } from '@/contexts/LibraryContext'
import { useMemo, type Ref } from 'react'

export type MatchModalBodyProps = {
  /** Lets the parent intercept leave (section change, hub back, close) while a match is selected but not yet applied. */
  closeRequestRef?: Ref<UnsavedChangesLeaveHandle | null>
}

export function MatchModalBody({ closeRequestRef }: MatchModalBodyProps) {
  const { resolvedItem, fetchPending } = useLibraryItemModal()
  const { filterData } = useLibrary()

  // Existing library values offered in the match field dropdowns (same source as the Details tab).
  const availableNarrators = useMemo(() => (filterData?.narrators || []).map((n) => ({ value: n, content: n })), [filterData?.narrators])
  const availableGenres = useMemo(() => (filterData?.genres || []).map((g) => ({ value: g, content: g })), [filterData?.genres])
  const availableTags = useMemo(() => (filterData?.tags || []).map((tag) => ({ value: tag, content: tag })), [filterData?.tags])
  const availableSeries = useMemo(() => (filterData?.series || []).map((s) => ({ value: s.id, content: s.name })), [filterData?.series])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
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
