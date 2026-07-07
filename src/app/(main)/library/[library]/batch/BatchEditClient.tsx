'use client'

import { batchGetLibraryItemsAction, batchUpdateLibraryItemsAction } from '@/app/actions/mediaActions'
import Btn from '@/components/ui/Btn'
import LazyTruncatingTooltipText from '@/components/ui/LazyTruncatingTooltipText'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Tooltip from '@/components/ui/Tooltip'
import BatchEpisodeMapDetailsPanel, { type BatchEpisodeMapDetailsPanelRef } from '@/components/widgets/batch-edit/BatchEpisodeMapDetailsPanel'
import BatchLibraryItemMapDetailsPanel, {
  type BatchLibraryItemMapDetailsPanelRef,
  type LibraryItemBatchMapPayload,
  type MapDetailsType
} from '@/components/widgets/batch-edit/BatchLibraryItemMapDetailsPanel'
import BookDetailsEdit, { type BookDetailsEditRef } from '@/components/widgets/BookDetailsEdit'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import EpisodeDetailsEdit, {
  type EpisodeBatchDetails,
  type EpisodeDetailsEditRef,
  type EpisodeDetailsEditSubmitResult
} from '@/components/widgets/EpisodeDetailsEdit'
import PodcastDetailsEdit, { type PodcastDetailsEditRef } from '@/components/widgets/PodcastDetailsEdit'
import { useLibrary } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useUnsavedNavigationGuard, allowProgrammaticNavigationWithoutTrapCleanup } from '@/hooks/useUnsavedNavigationGuard'
import { clearBatchEditSession, cloneLibraryItemForBatchEdit, readBatchEditSession, saveEpisodeBatchSequential, type BatchEditSession } from '@/lib/batchEdit'
import { mergeClasses } from '@/lib/merge-classes'
import type { SelectionKind } from '@/lib/selectedMediaItem'
import type { BookLibraryItem, LibraryItem, PodcastEpisode, PodcastLibraryItem, UpdateLibraryItemMediaPayload } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

interface BatchEditClientProps {
  libraryId: string
}

interface EpisodeBatchEntry {
  episode: PodcastEpisode
  libraryItemId: string
  podcastTitle: string
}

function getDefaultReturnPath(libraryId: string, selectionKind: SelectionKind): string {
  if (selectionKind === 'episode') return `/library/${libraryId}/latest`
  return `/library/${libraryId}/items`
}

export default function BatchEditClient({ libraryId }: BatchEditClientProps) {
  const router = useRouter()
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { userCanUpdate } = useUser()
  const { filterData } = useLibrary()
  const { streamLibraryItem } = useMediaContext()

  const [session, setSession] = useState<BatchEditSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [libraryItemCopies, setLibraryItemCopies] = useState<LibraryItem[]>([])
  const [episodeEntries, setEpisodeEntries] = useState<EpisodeBatchEntry[]>([])
  const [itemsWithChanges, setItemsWithChanges] = useState<Set<string>>(new Set())
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const originalLibraryItemsRef = useRef<LibraryItem[]>([])
  const originalEpisodeEntriesRef = useRef<EpisodeBatchEntry[]>([])
  const libraryItemMapPanelRef = useRef<BatchLibraryItemMapDetailsPanelRef>(null)
  const episodeMapPanelRef = useRef<BatchEpisodeMapDetailsPanelRef>(null)
  const libraryItemFormRefs = useRef<Map<string, BookDetailsEditRef | PodcastDetailsEditRef>>(new Map())
  const episodeFormRefs = useRef<Map<string, EpisodeDetailsEditRef>>(new Map())
  const libraryItemSaveBuffer = useRef<Map<string, { updatePayload: UpdateLibraryItemMediaPayload; hasChanges: boolean }>>(new Map())
  const episodeSaveBuffer = useRef<Map<string, EpisodeDetailsEditSubmitResult>>(new Map())

  const isEpisodeMode = session?.selectionKind === 'episode'
  const isPodcastMode = session?.selectionKind === 'podcast'
  const hasChanges = itemsWithChanges.size > 0

  const availableAuthors = useMemo(() => (filterData?.authors || []).map((a) => ({ value: a.id, content: a.name })), [filterData?.authors])
  const availableNarrators = useMemo(() => (filterData?.narrators || []).map((n) => ({ value: n, content: n })), [filterData?.narrators])
  const availableGenres = useMemo(() => (filterData?.genres || []).map((g) => ({ value: g, content: g })), [filterData?.genres])
  const availableTags = useMemo(() => (filterData?.tags || []).map((tag) => ({ value: tag, content: tag })), [filterData?.tags])
  const availableSeries = useMemo(() => (filterData?.series || []).map((s) => ({ value: s.id, content: s.name })), [filterData?.series])

  const loadBatchData = useCallback(
    async (batchSession: BatchEditSession) => {
      setLoading(true)
      try {
        if (batchSession.selectionKind === 'episode') {
          const uniqueLibraryItemIds = [...new Set(batchSession.items.map((item) => item.libraryItemId))]
          const response = await batchGetLibraryItemsAction(uniqueLibraryItemIds)
          const libraryItemsById = new Map(response.libraryItems.map((item) => [item.id, item]))
          const entries: EpisodeBatchEntry[] = []

          for (const selected of batchSession.items) {
            if (!selected.episodeId) continue
            const libraryItem = libraryItemsById.get(selected.libraryItemId)
            if (!libraryItem || libraryItem.mediaType !== 'podcast') continue
            const podcastItem = libraryItem as PodcastLibraryItem
            const episode = podcastItem.media.episodes?.find((ep) => ep.id === selected.episodeId)
            if (!episode) {
              showToast(t('ToastFailedToUpdate'), { type: 'error' })
              continue
            }
            entries.push({
              episode: { ...episode },
              libraryItemId: podcastItem.id,
              podcastTitle: podcastItem.media.metadata.title || podcastItem.id
            })
          }

          if (entries.length === 0) {
            clearBatchEditSession()
            router.replace(getDefaultReturnPath(libraryId, 'episode'))
            return
          }

          originalEpisodeEntriesRef.current = entries.map((entry) => ({
            libraryItemId: entry.libraryItemId,
            podcastTitle: entry.podcastTitle,
            episode: { ...entry.episode }
          }))
          setEpisodeEntries(entries)
          setLibraryItemCopies([])
        } else {
          const libraryItemIds = batchSession.items.map((item) => item.libraryItemId)
          const response = await batchGetLibraryItemsAction(libraryItemIds)
          if (!response.libraryItems.length) {
            clearBatchEditSession()
            router.replace(getDefaultReturnPath(libraryId, batchSession.selectionKind))
            return
          }
          originalLibraryItemsRef.current = response.libraryItems
          setLibraryItemCopies(response.libraryItems.map((item) => cloneLibraryItemForBatchEdit(item)))
          setEpisodeEntries([])
        }
      } catch (error) {
        console.error('Failed to load batch edit data', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
        clearBatchEditSession()
        router.replace(`/library/${libraryId}`)
      } finally {
        setLoading(false)
      }
    },
    [libraryId, router, showToast, t]
  )

  useEffect(() => {
    const batchSession = readBatchEditSession()
    if (!batchSession || batchSession.libraryId !== libraryId || !userCanUpdate) {
      router.replace(`/library/${libraryId}`)
      return
    }
    setSession(batchSession)
    void loadBatchData(batchSession)
  }, [libraryId, loadBatchData, router, userCanUpdate])

  const backLeavePath = useMemo(
    () => (session ? session.returnPath || getDefaultReturnPath(libraryId, session.selectionKind) : undefined),
    [libraryId, session]
  )

  useUnsavedNavigationGuard({ enabled: hasChanges, backLeavePath })

  const handleLibraryItemChange = useCallback(({ libraryItemId, hasChanges: hasItemChanges }: { libraryItemId: string; hasChanges: boolean }) => {
    setItemsWithChanges((prev) => {
      const alreadyTracked = prev.has(libraryItemId)
      if (hasItemChanges === alreadyTracked) return prev
      const next = new Set(prev)
      if (hasItemChanges) next.add(libraryItemId)
      else next.delete(libraryItemId)
      return next
    })
  }, [])

  const handleEpisodeChange = useCallback(({ episodeId, hasChanges: hasItemChanges }: { episodeId: string; hasChanges: boolean }) => {
    setItemsWithChanges((prev) => {
      const alreadyTracked = prev.has(episodeId)
      if (hasItemChanges === alreadyTracked) return prev
      const next = new Set(prev)
      if (hasItemChanges) next.add(episodeId)
      else next.delete(episodeId)
      return next
    })
  }, [])

  const handleLibraryItemMapApply = useCallback(
    (payload: LibraryItemBatchMapPayload, mapType: MapDetailsType) => {
      libraryItemCopies.forEach((item) => {
        libraryItemFormRefs.current.get(item.id)?.mapBatchDetails(payload, mapType)
      })
      showToast(t('ToastBatchApplyDetailsToItemsSuccess'), { type: 'success' })
    },
    [libraryItemCopies, showToast, t]
  )

  const handleEpisodeMapApply = useCallback(
    (payload: Partial<EpisodeBatchDetails>) => {
      episodeEntries.forEach((entry) => {
        episodeFormRefs.current.get(entry.episode.id)?.mapBatchDetails(payload)
      })
      showToast(t('ToastBatchApplyDetailsToItemsSuccess'), { type: 'success' })
    },
    [episodeEntries, showToast, t]
  )

  const handleSave = useCallback(async () => {
    if (!session || isProcessing) return

    setIsProcessing(true)
    try {
      if (isEpisodeMode) {
        episodeSaveBuffer.current.clear()
        for (const entry of episodeEntries) {
          episodeFormRefs.current.get(entry.episode.id)?.submit()
        }

        const updates = episodeEntries
          .map((entry) => {
            const result = episodeSaveBuffer.current.get(entry.episode.id)
            if (!result?.hasChanges) return null
            return {
              libraryItemId: entry.libraryItemId,
              episodeId: entry.episode.id,
              payload: result.updatePayload
            }
          })
          .filter((update): update is NonNullable<typeof update> => update != null)

        if (updates.length === 0) {
          showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
          return
        }

        for (const entry of episodeEntries) {
          const result = episodeSaveBuffer.current.get(entry.episode.id)
          if (result?.invalidPubDate) {
            showToast(t('ToastDateTimeInvalidOrIncomplete'), { type: 'error' })
            return
          }
        }

        const count = await saveEpisodeBatchSequential(updates)
        const returnPath = session.returnPath || getDefaultReturnPath(libraryId, 'episode')
        clearBatchEditSession()
        showToast(t('MessageItemsUpdated', { 0: count.toString() }), { type: 'success' })
        allowProgrammaticNavigationWithoutTrapCleanup()
        flushSync(() => setItemsWithChanges(new Set()))
        router.replace(returnPath)
      } else {
        libraryItemSaveBuffer.current.clear()
        for (const item of libraryItemCopies) {
          libraryItemFormRefs.current.get(item.id)?.submit()
        }

        const updates = libraryItemCopies
          .map((item) => {
            const result = libraryItemSaveBuffer.current.get(item.id)
            if (!result?.hasChanges) return null
            return { id: item.id, mediaPayload: result.updatePayload }
          })
          .filter((update): update is NonNullable<typeof update> => update != null)

        if (updates.length === 0) {
          showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
          return
        }

        const response = await batchUpdateLibraryItemsAction(updates)
        if (response.updates) {
          const returnPath = session.returnPath || getDefaultReturnPath(libraryId, session.selectionKind)
          clearBatchEditSession()
          showToast(t('MessageItemsUpdated', { 0: response.updates.toString() }), { type: 'success' })
          allowProgrammaticNavigationWithoutTrapCleanup()
          flushSync(() => setItemsWithChanges(new Set()))
          router.replace(returnPath)
        } else {
          showToast(t('MessageNoUpdatesWereNecessary'), { type: 'warning' })
        }
      }
    } catch (error) {
      console.error('Failed to save batch edit', error)
      showToast(t('ToastFailedToUpdate'), { type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }, [episodeEntries, isEpisodeMode, isProcessing, libraryId, libraryItemCopies, router, session, showToast, t])

  const handleReset = useCallback(() => {
    if (isEpisodeMode) {
      setEpisodeEntries(
        originalEpisodeEntriesRef.current.map((entry) => ({
          libraryItemId: entry.libraryItemId,
          podcastTitle: entry.podcastTitle,
          episode: { ...entry.episode }
        }))
      )
    } else {
      setLibraryItemCopies(originalLibraryItemsRef.current.map((item) => cloneLibraryItemForBatchEdit(item)))
    }
    setItemsWithChanges(new Set())
    libraryItemSaveBuffer.current.clear()
    episodeSaveBuffer.current.clear()
  }, [isEpisodeMode])

  if (loading || !session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingIndicator variant="inline" />
      </div>
    )
  }

  return (
    <div className={mergeClasses('page bg-bg flex h-full min-h-0 flex-col', streamLibraryItem && 'streaming')}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4">
        {isEpisodeMode ? (
          <BatchEpisodeMapDetailsPanel
            ref={episodeMapPanelRef}
            episodes={episodeEntries.map((entry) => entry.episode)}
            onApply={handleEpisodeMapApply}
            disabled={isProcessing}
          />
        ) : (
          <BatchLibraryItemMapDetailsPanel
            ref={libraryItemMapPanelRef}
            isPodcast={isPodcastMode}
            libraryItems={libraryItemCopies}
            availableAuthors={availableAuthors}
            availableNarrators={availableNarrators}
            availableGenres={availableGenres}
            availableTags={availableTags}
            availableSeries={availableSeries}
            onApply={handleLibraryItemMapApply}
            disabled={isProcessing}
          />
        )}

        <div className="flex flex-col items-center gap-4">
          {isEpisodeMode
            ? episodeEntries.map((entry) => (
                <div key={entry.episode.id} className="border-foreground/15 w-full max-w-3xl border p-2 sm:p-6">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <Tooltip text={t('MessageBatchEditPopulateMapDetailsItemHelp')} position="bottom" className="self-end sm:order-2">
                      <Btn size="small" disabled={isProcessing} onClick={() => episodeMapPanelRef.current?.populateFromExisting(entry.episode.id)}>
                        {t('ButtonBatchEditPopulateMapDetails')}
                      </Btn>
                    </Tooltip>
                    <div className="order-last min-w-0 flex-1 sm:order-1">
                      <LazyTruncatingTooltipText text={entry.podcastTitle} className="text-foreground-muted text-sm" position="top" />
                    </div>
                  </div>
                  <EpisodeDetailsEdit
                    ref={(formRef) => {
                      if (formRef) episodeFormRefs.current.set(entry.episode.id, formRef)
                      else episodeFormRefs.current.delete(entry.episode.id)
                    }}
                    episode={entry.episode}
                    onChange={handleEpisodeChange}
                    onSubmit={(result) => {
                      episodeSaveBuffer.current.set(entry.episode.id, result)
                    }}
                  />
                </div>
              ))
            : libraryItemCopies.map((libraryItem) => (
                <div key={libraryItem.id} className="border-foreground/15 w-full max-w-3xl border p-2 sm:p-6">
                  <div className="flex items-center justify-end">
                    <Tooltip text={t('MessageBatchEditPopulateMapDetailsItemHelp')} position="bottom">
                      <Btn size="small" disabled={isProcessing} onClick={() => libraryItemMapPanelRef.current?.populateFromExisting(libraryItem.id)}>
                        {t('ButtonBatchEditPopulateMapDetails')}
                      </Btn>
                    </Tooltip>
                  </div>
                  {libraryItem.mediaType === 'book' ? (
                    <BookDetailsEdit
                      ref={(formRef) => {
                        if (formRef) libraryItemFormRefs.current.set(libraryItem.id, formRef)
                        else libraryItemFormRefs.current.delete(libraryItem.id)
                      }}
                      libraryItem={libraryItem as BookLibraryItem}
                      availableAuthors={availableAuthors}
                      availableNarrators={availableNarrators}
                      availableGenres={availableGenres}
                      availableTags={availableTags}
                      availableSeries={availableSeries}
                      onChange={handleLibraryItemChange}
                      onSubmit={(result) => {
                        libraryItemSaveBuffer.current.set(libraryItem.id, result)
                      }}
                    />
                  ) : (
                    <PodcastDetailsEdit
                      ref={(formRef) => {
                        if (formRef) libraryItemFormRefs.current.set(libraryItem.id, formRef)
                        else libraryItemFormRefs.current.delete(libraryItem.id)
                      }}
                      libraryItem={libraryItem as PodcastLibraryItem}
                      availableGenres={availableGenres}
                      availableTags={availableTags}
                      onChange={handleLibraryItemChange}
                      onSubmit={(result) => {
                        libraryItemSaveBuffer.current.set(libraryItem.id, result)
                      }}
                    />
                  )}
                </div>
              ))}
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <LoadingIndicator variant="inline" />
        </div>
      )}

      {(hasChanges || isProcessing) && (
        <div className="border-foreground/15 bg-primary box-shadow-lg-up z-40 flex h-20 w-full shrink-0 items-center border-t px-4">
          <div className="grow" />
          <div className="flex items-center gap-2">
            <Btn disabled={isProcessing} onClick={() => setShowResetConfirm(true)}>
              {t('ButtonReset')}
            </Btn>
            <Btn color="bg-success" className="text-lg" loading={isProcessing} disabled={isProcessing} onClick={() => void handleSave()}>
              {t('ButtonSave')}
            </Btn>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showResetConfirm}
        message={t('MessageResetBatchEditConfirm')}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false)
          handleReset()
        }}
      />
    </div>
  )
}
