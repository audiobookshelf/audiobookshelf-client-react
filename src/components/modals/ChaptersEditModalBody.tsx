'use client'

import { useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import BulkChapterPatternPanel from '@/components/widgets/chapters-edit/BulkChapterPatternPanel'
import ChapterTransformPreview from '@/components/widgets/chapters-edit/ChapterTransformPreview'
import ChaptersModalTable from '@/components/widgets/chapters-edit/ChaptersModalTable'
import ChaptersModalToolbar from '@/components/widgets/chapters-edit/ChaptersModalToolbar'
import FindChaptersPanel from '@/components/widgets/chapters-edit/FindChaptersPanel'
import FindChaptersResults from '@/components/widgets/chapters-edit/FindChaptersResults'
import FindChaptersStatsPanel from '@/components/widgets/chapters-edit/FindChaptersStatsPanel'
import SetChaptersFromTracksPanel from '@/components/widgets/chapters-edit/SetChaptersFromTracksPanel'
import ShiftTimesPanel from '@/components/widgets/chapters-edit/ShiftTimesPanel'
import { useChapterEditor } from '@/hooks/useChapterEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { hasNonPlaceholderChapters } from '@/lib/chapters/chapterEditorUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { isBookMediaWithTracks, type BookLibraryItem } from '@/types/api'
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'

export type ChaptersEditCloseHandle = {
  requestLeave: (onAllow: () => void) => void
}

interface ChaptersEditModalBodyProps {
  closeRequestRef?: Ref<ChaptersEditCloseHandle | null>
  onPendingChange?: (pending: boolean) => void
}

interface ChaptersEditContentProps {
  libraryItem: BookLibraryItem
  closeRequestRef?: Ref<ChaptersEditCloseHandle | null>
  onPendingChange?: (pending: boolean) => void
  onItemUpdated?: (item: BookLibraryItem) => void
}

function ChaptersEditContent({ libraryItem, closeRequestRef, onPendingChange, onItemUpdated }: ChaptersEditContentProps) {
  const t = useTypeSafeTranslations()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pendingLeaveRef = useRef<(() => void) | null>(null)
  const [footerShadow, setFooterShadow] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const editor = useChapterEditor({
    initialLibraryItem: libraryItem,
    onItemUpdated
  })

  const {
    media,
    mediaDuration,
    mediaDurationRounded,
    tracks,
    newChapters,
    dirtyBaseline,
    displayCurrentChapters,
    stagedChapters,
    isTransformPreviewOpen,
    canApplyStagedTransform,
    hasChanges,
    showSecondInputs,
    activeToolbarPanel,
    lookupResult,
    lookupResultForPreview,
    isLookupPending,
    lookupAsinError,
    shiftAmount,
    previewShiftAmount,
    bulkChapterInput,
    removeBranding,
    mapChapterTitles,
    showBulkPatternPanel,
    showShiftTimes,
    detectedPattern,
    bulkChapterCount,
    isTableEditMode,
    confirmState,
    isPending,
    preview,
    setShowSecondInputs,
    toggleToolbarPanel,
    closeToolbarPanel,
    closeShiftTimesPanel,
    toggleShiftTimesPanel,
    handleShiftAmountChange,
    setPreviewShiftAmount,
    setLookupResult,
    handleLookupResult,
    setBulkChapterInput,
    setRemoveBranding,
    setMapChapterTitles,
    setShowBulkPatternPanel,
    setBulkChapterCount,
    setDetectedPattern,
    toggleTableEditMode,
    setConfirmState,
    handleSave,
    applyStagedTransform,
    handleRemoveAll,
    handleBulkChapterAdd,
    handleAddBulkChapters,
    handleAdjustChapterStartTime,
    handleChapterStartChange,
    handleChapterTitleDraft,
    handleChapterTitleCommit,
    handleChapterIncrementTime,
    handleChapterRemove,
    handleChapterInsertBelow,
    resetEditorChapters
  } = editor

  const updateFooterShadow = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const isScrollable = container.scrollHeight > container.clientHeight
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 1
    setFooterShadow(isScrollable && !isAtBottom)
  }, [])

  useEffect(() => {
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
  }, [updateFooterShadow])

  useLayoutEffect(() => {
    updateFooterShadow()
  }, [updateFooterShadow, isTableEditMode, activeToolbarPanel, lookupResult, showBulkPatternPanel, showShiftTimes, newChapters.length, isTransformPreviewOpen])

  useEffect(() => {
    onPendingChange?.(isPending)
    return () => onPendingChange?.(false)
  }, [isPending, onPendingChange])

  const { destroyAudioEl } = preview
  useEffect(() => {
    return () => {
      destroyAudioEl()
    }
  }, [destroyAudioEl])

  const requestLeave = useCallback(
    (onAllow: () => void) => {
      if (hasChanges) {
        pendingLeaveRef.current = onAllow
        setShowCloseConfirm(true)
        return
      }
      destroyAudioEl()
      onAllow()
    },
    [destroyAudioEl, hasChanges]
  )

  const handleCancelLeave = useCallback(() => {
    pendingLeaveRef.current = null
    setShowCloseConfirm(false)
  }, [])

  const handleDiscardAndLeave = useCallback(() => {
    const onAllow = pendingLeaveRef.current
    pendingLeaveRef.current = null
    setShowCloseConfirm(false)
    destroyAudioEl()
    onAllow?.()
  }, [destroyAudioEl])

  const handleSaveAndLeave = useCallback(() => {
    const onAllow = pendingLeaveRef.current
    const started = handleSave(() => {
      pendingLeaveRef.current = null
      setShowCloseConfirm(false)
      destroyAudioEl()
      onAllow?.()
    })
    if (!started) {
      pendingLeaveRef.current = null
      setShowCloseConfirm(false)
    }
  }, [destroyAudioEl, handleSave])

  useImperativeHandle(closeRequestRef, () => ({ requestLeave }), [requestLeave])

  const footerDisabled = !hasChanges || isPending
  const showTable = hasNonPlaceholderChapters(newChapters)
  const currentChapterCount = showTable ? newChapters.length : 0
  const lookupResultsOpen = !!lookupResult

  const handleLookupBack = useCallback(() => {
    destroyAudioEl()
    setLookupResult(null)
    setMapChapterTitles(false)
    setRemoveBranding(false)
  }, [destroyAudioEl, setLookupResult, setMapChapterTitles, setRemoveBranding])

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg">
        <div
          ref={scrollContainerRef}
          className={mergeClasses(
            'relative min-h-0 flex-1 px-4 py-4',
            isTransformPreviewOpen ? 'flex flex-col overflow-hidden' : 'overflow-x-hidden overflow-y-auto'
          )}
        >
          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
            {!isTableEditMode && <ChaptersModalToolbar activePanel={activeToolbarPanel} isLookupPending={isLookupPending} onTogglePanel={toggleToolbarPanel} />}
            {isTableEditMode && (
              <>
                {showTable && (
                  <Btn color="bg-primary" size="small" onClick={handleRemoveAll}>
                    {t('ButtonRemoveAll')}
                  </Btn>
                )}
                {showTable && newChapters.length > 1 && (
                  <Btn color={showShiftTimes ? 'bg-bg' : 'bg-primary'} size="small" onClick={toggleShiftTimesPanel}>
                    {t('ButtonShiftTimes')}
                  </Btn>
                )}
                <Checkbox value={showSecondInputs} label={t('LabelShowSeconds')} size="small" onChange={setShowSecondInputs} />
              </>
            )}
            <div className="grow" />
            <Btn color="bg-primary" size="small" onClick={toggleTableEditMode}>
              {isTableEditMode ? t('ButtonDoneEditing') : showTable ? t('ButtonManualEdit') : t('ButtonAddChapters')}
            </Btn>
          </div>

          {!isTableEditMode && activeToolbarPanel === 'setFromTracks' && (
            <SetChaptersFromTracksPanel currentChapterCount={currentChapterCount} trackChapterCount={tracks.length} onClose={closeToolbarPanel} />
          )}

          {isTableEditMode && showShiftTimes && (
            <ShiftTimesPanel shiftAmount={shiftAmount} onShiftAmountChange={handleShiftAmountChange} onClose={closeShiftTimesPanel} />
          )}

          {!isTableEditMode && activeToolbarPanel === 'lookup' && !lookupResultsOpen && !isLookupPending && (
            <FindChaptersPanel metadata={media.metadata} initialError={lookupAsinError} onClose={closeToolbarPanel} onResult={handleLookupResult} />
          )}

          {!isTableEditMode && lookupResultsOpen && lookupResult && (
            <FindChaptersStatsPanel
              lookupResult={lookupResultForPreview ?? lookupResult}
              currentChapterCount={currentChapterCount}
              mediaDurationRounded={mediaDurationRounded}
              onBack={handleLookupBack}
              onClose={closeToolbarPanel}
            />
          )}

          {isTransformPreviewOpen && stagedChapters && lookupResult ? (
            <FindChaptersResults
              lookupResult={lookupResultForPreview ?? lookupResult}
              currentChapters={displayCurrentChapters}
              afterChapters={stagedChapters}
              mediaDuration={mediaDuration}
              preview={preview}
              tracks={tracks}
              mapChapterTitles={mapChapterTitles}
              removeBranding={removeBranding}
              applyDisabled={!canApplyStagedTransform}
              previewShiftAmount={previewShiftAmount}
              onPreviewShiftAmountChange={setPreviewShiftAmount}
              onMapChapterTitlesChange={setMapChapterTitles}
              onRemoveBrandingChange={setRemoveBranding}
              onApply={applyStagedTransform}
            />
          ) : isTransformPreviewOpen && stagedChapters ? (
            <ChapterTransformPreview
              currentChapters={displayCurrentChapters}
              afterChapters={stagedChapters}
              preview={preview}
              tracks={tracks}
              applyDisabled={!canApplyStagedTransform}
              previewShiftAmount={previewShiftAmount}
              onPreviewShiftAmountChange={setPreviewShiftAmount}
              onApply={applyStagedTransform}
            />
          ) : (
            <>
              <ChaptersModalTable
                isEditMode={isTableEditMode}
                chapters={newChapters}
                dirtyBaseline={dirtyBaseline}
                mediaDuration={mediaDuration}
                showSecondInputs={showSecondInputs}
                bulkChapterInput={bulkChapterInput}
                preview={preview}
                tracks={tracks}
                onBulkChapterInputChange={setBulkChapterInput}
                onBulkChapterAdd={handleBulkChapterAdd}
                onChapterStartChange={handleChapterStartChange}
                onChapterTitleDraft={handleChapterTitleDraft}
                onChapterTitleCommit={handleChapterTitleCommit}
                onChapterIncrementTime={handleChapterIncrementTime}
                onChapterRemove={handleChapterRemove}
                onChapterInsertBelow={handleChapterInsertBelow}
                onAdjustChapterStartTime={handleAdjustChapterStartTime}
              />

              {isTableEditMode && showBulkPatternPanel && (
                <BulkChapterPatternPanel
                  detectedPattern={detectedPattern}
                  bulkChapterCount={bulkChapterCount}
                  onBulkChapterCountChange={setBulkChapterCount}
                  onClose={() => {
                    setShowBulkPatternPanel(false)
                    setDetectedPattern(null)
                  }}
                  onConfirm={handleAddBulkChapters}
                />
              )}
            </>
          )}

          {isPending && (
            <div className="bg-bg/50 absolute inset-0 z-10 flex items-center justify-center">
              <LoadingIndicator variant="inline" />
            </div>
          )}
        </div>

        <div
          className={mergeClasses(
            'bg-bg border-border flex shrink-0 justify-end gap-3 border-t px-4 py-3 transition-shadow duration-200',
            footerShadow && 'box-shadow-md-up'
          )}
        >
          <Btn
            size="small"
            disabled={footerDisabled}
            onClick={() =>
              setConfirmState({
                message: t('MessageDiscardChaptersConfirm'),
                onConfirm: () => {
                  setConfirmState(null)
                  resetEditorChapters()
                }
              })
            }
          >
            {t('ButtonDiscardChanges')}
          </Btn>
          <Btn color="bg-success" size="small" loading={isPending} disabled={footerDisabled} onClick={() => handleSave()}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </div>

      {confirmState && <ConfirmDialog isOpen message={confirmState.message} onClose={() => setConfirmState(null)} onConfirm={() => confirmState.onConfirm()} />}

      <ConfirmDialog
        isOpen={showCloseConfirm}
        message={t('MessageConfirmCloseChaptersWithChanges')}
        altButtonText={t('ButtonDiscard')}
        yesButtonText={t('ButtonSave')}
        processing={isPending}
        onClose={handleCancelLeave}
        onAlt={handleDiscardAndLeave}
        onConfirm={handleSaveAndLeave}
      />
    </>
  )
}

export function ChaptersEditModalBody({ closeRequestRef, onPendingChange }: ChaptersEditModalBodyProps) {
  const { resolvedItem, fetchPending, syncResolvedItem } = useLibraryItemModal()
  const showLoading = fetchPending && !resolvedItem
  const bookItem = resolvedItem?.mediaType === 'book' && isBookMediaWithTracks(resolvedItem.media) ? (resolvedItem as BookLibraryItem) : null

  if (showLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg">
        <div className="flex flex-1 items-center justify-center">
          <LoadingIndicator variant="inline" />
        </div>
      </div>
    )
  }

  if (!bookItem) return null

  return (
    <ChaptersEditContent
      key={bookItem.id}
      libraryItem={bookItem}
      closeRequestRef={closeRequestRef}
      onPendingChange={onPendingChange}
      onItemUpdated={syncResolvedItem}
    />
  )
}
