'use client'

import { updatePodcastEpisodeAction } from '@/app/actions/mediaActions'
import EpisodeModal, { useEpisodeModal, type EpisodeModalItemSource } from '@/components/modals/EpisodeModal'
import Btn from '@/components/ui/Btn'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import EpisodeDetailsEdit, { type EpisodeDetailsEditRef, type EpisodeDetailsEditSubmitResult } from '@/components/widgets/EpisodeDetailsEdit'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition, type TransitionStartFunction } from 'react'

export type EpisodeEditModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved?: (episode: PodcastEpisode, libraryItem: PodcastLibraryItem) => void
} & EpisodeModalItemSource

type EpisodeEditModalContentProps = {
  isOpen: boolean
  startSaveTransition: TransitionStartFunction
  isSavePending: boolean
  onClose: () => void
  onSaved?: (episode: PodcastEpisode, libraryItem: PodcastLibraryItem) => void
  stableBodyHeight: boolean
}

function createPlaceholderEpisode(episodeId: string, libraryItemId: string): PodcastEpisode {
  return {
    id: episodeId,
    libraryItemId,
    podcastId: libraryItemId,
    title: '',
    chapters: [],
    addedAt: 0,
    updatedAt: 0
  }
}

function EpisodeEditModalContent({ isOpen, startSaveTransition, isSavePending, onClose, onSaved, stableBodyHeight }: EpisodeEditModalContentProps) {
  const { resolvedEpisode, resolvedLibraryItem, fetchPending, pendingEpisodeId, syncResolvedEpisode } = useEpisodeModal()
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [hasChanges, setHasChanges] = useState(false)
  const saveAndCloseRef = useRef(false)
  const detailsRef = useRef<EpisodeDetailsEditRef>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [footerShadow, setFooterShadow] = useState(false)

  const resolvedEpisodeId = resolvedEpisode?.id

  useEffect(() => {
    if (!isOpen) {
      setHasChanges(false)
      saveAndCloseRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!resolvedEpisodeId) return
    setHasChanges(false)
    saveAndCloseRef.current = false
  }, [resolvedEpisodeId])

  useEffect(() => {
    setHasChanges(false)
    saveAndCloseRef.current = false
  }, [pendingEpisodeId])

  const updateFooterShadow = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const isScrollable = container.scrollHeight > container.clientHeight
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 1
    setFooterShadow(isScrollable && !isAtBottom)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const container = scrollContainerRef.current
    if (!container) return
    updateFooterShadow()
    container.addEventListener('scroll', updateFooterShadow)
    const resizeObserver = new ResizeObserver(updateFooterShadow)
    resizeObserver.observe(container)
    return () => {
      container.removeEventListener('scroll', updateFooterShadow)
      resizeObserver.disconnect()
    }
  }, [isOpen, updateFooterShadow])

  useLayoutEffect(() => {
    if (!isOpen) return
    updateFooterShadow()
  }, [isOpen, resolvedEpisodeId, pendingEpisodeId, fetchPending, updateFooterShadow])

  const handleChange = useCallback((_details: { episodeId: string; hasChanges: boolean }) => {
    setHasChanges(_details.hasChanges)
  }, [])

  const handleSubmit = useCallback(
    (result: EpisodeDetailsEditSubmitResult) => {
      if (result.invalidPubDate) {
        showToast(t('ToastDateTimeInvalidOrIncomplete'), { type: 'error' })
        return
      }

      const libraryItemId = resolvedLibraryItem?.id
      const episodeId = resolvedEpisode?.id
      if (!libraryItemId || !episodeId) return

      if (!result.hasChanges) {
        if (saveAndCloseRef.current) {
          onClose()
        } else {
          showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
        }
        return
      }

      startSaveTransition(async () => {
        try {
          const updatedLibraryItem = await updatePodcastEpisodeAction(libraryItemId, episodeId, result.updatePayload)
          const updatedEpisode = updatedLibraryItem.media.episodes?.find((ep) => ep.id === episodeId)
          if (!updatedEpisode) {
            throw new Error('Updated episode not found in response')
          }
          showToast(t('ToastItemUpdateSuccess'), { type: 'success' })
          syncResolvedEpisode(updatedEpisode, updatedLibraryItem)
          onSaved?.(updatedEpisode, updatedLibraryItem)
          if (saveAndCloseRef.current) {
            onClose()
          }
        } catch (error) {
          console.error('Failed to update episode', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [onClose, onSaved, resolvedEpisode?.id, resolvedLibraryItem?.id, showToast, startSaveTransition, syncResolvedEpisode, t]
  )

  const handleSave = (close: boolean = false) => {
    saveAndCloseRef.current = close
    detailsRef.current?.submit()
  }

  const saveDisabled = !hasChanges || isSavePending || !resolvedEpisode || fetchPending

  const showPlaceholderShell = fetchPending && !resolvedEpisode && pendingEpisodeId !== null
  const placeholderEpisode =
    showPlaceholderShell && pendingEpisodeId && resolvedLibraryItem
      ? createPlaceholderEpisode(pendingEpisodeId, resolvedLibraryItem.id)
      : showPlaceholderShell && pendingEpisodeId
        ? createPlaceholderEpisode(pendingEpisodeId, '')
        : null

  const fetchLoadingOverlay = (
    <div className="bg-bg/50 absolute inset-0 z-10 flex items-center justify-center">
      <LoadingIndicator variant="inline" />
    </div>
  )

  const formInner = resolvedEpisode ? (
    <EpisodeDetailsEdit key={resolvedEpisode.id} ref={detailsRef} episode={resolvedEpisode} onChange={handleChange} onSubmit={handleSubmit} />
  ) : showPlaceholderShell && placeholderEpisode ? (
    <div className="relative">
      <EpisodeDetailsEdit
        key={`placeholder-episode-${pendingEpisodeId}`}
        ref={detailsRef}
        episode={placeholderEpisode}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      {fetchLoadingOverlay}
    </div>
  ) : fetchPending ? (
    <div className="flex min-h-[24rem] items-center justify-center">
      <LoadingIndicator variant="inline" />
    </div>
  ) : null

  return (
    <div
      className={
        stableBodyHeight
          ? 'bg-bg border-border flex max-h-[80vh] w-full flex-col overflow-hidden rounded-lg border'
          : 'bg-bg border-border flex max-h-[85vh] w-full flex-col rounded-lg border'
      }
    >
      <div ref={scrollContainerRef} className="min-h-0 overflow-x-hidden overflow-y-auto">
        {formInner}
      </div>

      <div
        className={`bg-bg border-border flex shrink-0 justify-end gap-3 border-t px-4 py-3 transition-shadow duration-200 ${footerShadow ? 'box-shadow-md-up' : ''}`}
      >
        <Btn onClick={() => handleSave(false)} disabled={saveDisabled} className="hidden md:inline-flex">
          {t('ButtonSave')}
        </Btn>
        <Btn onClick={() => handleSave(true)} disabled={saveDisabled}>
          <span className="hidden md:inline">{t('ButtonSaveAndClose')}</span>
          <span className="md:hidden">{t('ButtonSave')}</span>
        </Btn>
      </div>
    </div>
  )
}

/**
 * Modal for editing podcast episode metadata.
 * Pass `navCtx` to load episodes and enable prev/next, or `libraryItem` + `episode` for direct mode.
 */
export default function EpisodeEditModal(props: EpisodeEditModalProps) {
  const { isOpen, onClose, onSaved } = props
  const navCtxMode = 'navCtx' in props
  const [isSavePending, startSaveTransition] = useTransition()

  return (
    <EpisodeModal
      isOpen={isOpen}
      onClose={onClose}
      {...(navCtxMode ? { navCtx: props.navCtx } : { libraryItem: props.libraryItem, episode: props.episode })}
      additionalProcessing={isSavePending}
      className="sm:max-w-screen md:max-w-[800px]"
    >
      <EpisodeEditModalContent
        isOpen={isOpen}
        startSaveTransition={startSaveTransition}
        isSavePending={isSavePending}
        onClose={onClose}
        onSaved={onSaved}
        stableBodyHeight={navCtxMode}
      />
    </EpisodeModal>
  )
}
