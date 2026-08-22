'use client'

import { useLibraryItemModal } from '@/components/modals/LibraryItemModal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import ChaptersModalTable from '@/components/widgets/chapters-edit/ChaptersModalTable'
import FindChaptersPanel from '@/components/widgets/chapters-edit/FindChaptersPanel'
import { ShiftTimesFields } from '@/components/widgets/chapters-edit/ShiftTimesPanel'
import { useChapterEditor } from '@/hooks/useChapterEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { formatDuration } from '@/lib/formatDuration'
import { mergeClasses } from '@/lib/merge-classes'
import { isBookMediaWithTracks, type AudibleChapterSearchResult, type BookLibraryItem } from '@/types/api'
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

function LookupComparison({
  lookupResult,
  baselineCount,
  mediaDurationRounded
}: {
  lookupResult: AudibleChapterSearchResult
  baselineCount: number
  mediaDurationRounded: number
}) {
  const t = useTypeSafeTranslations()
  const foundChapterCount = lookupResult.chapters.length
  const foundDurationSec = lookupResult.runtimeLengthSec
  const countsDiffer = baselineCount !== foundChapterCount
  const durationShorter = foundDurationSec > mediaDurationRounded
  const durationLonger = foundDurationSec < mediaDurationRounded
  const durationMatches = !durationShorter && !durationLonger
  const durationDiffSec = Math.abs(foundDurationSec - mediaDurationRounded)
  const durationDiffDescription = formatDuration(durationDiffSec, t, { style: 'long', showSeconds: true })
  const durationDiffText = durationShorter
    ? ` ${t('LabelDurationComparisonShorter', { 0: durationDiffDescription })}`
    : durationLonger
      ? ` ${t('LabelDurationComparisonLonger', { 0: durationDiffDescription })}`
      : ` ${t('LabelLookupComparisonSame')}`
  const chapterWasText = countsDiffer ? t('MessageLookupChaptersWas', { 0: baselineCount }) : ` ${t('LabelLookupComparisonSame')}`

  return (
    <p className="text-sm" role="status">
      {t.rich('MessageLookupComparison', {
        0: secondsToTimestamp(foundDurationSec),
        1: durationDiffText,
        2: foundChapterCount,
        3: chapterWasText,
        durationDiff: (chunks) => (durationMatches ? chunks : <span className="text-warning font-semibold">{chunks}</span>),
        chapterWas: (chunks) => (countsDiffer ? <span className="text-warning font-semibold">{chunks}</span> : chunks)
      })}
    </p>
  )
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
    hasChanges,
    lookupResult,
    lookupResultForPreview,
    lookupBaselineCount,
    canMapChapterTitles,
    shiftAmount,
    addChapterInput,
    removeBranding,
    mapChapterTitles,
    selectedKeys,
    chapterMatchDebug,
    chapterMatchDebugActive,
    showChapterMatchDebug,
    confirmState,
    isPending,
    preview,
    handleShiftAmountChange,
    handleApplyShift,
    handleLookupResult,
    setAddChapterInput,
    handleMapChapterTitlesChange,
    handleRemoveBrandingChange,
    handleChapterCheckedChange,
    handleToggleAllChaptersSelected,
    handleRemoveSelected,
    handleSetChaptersFromTracks,
    setConfirmState,
    handleSave,
    handleAddChapterFromInput,
    handleAdjustChapterStartTime,
    handleChapterStartChange,
    handleChapterTitleDraft,
    handleChapterTitleCommit,
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
  }, [updateFooterShadow, lookupResult, newChapters.length])

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

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg">
        <div className="bg-bg border-border shrink-0 border-b px-4 py-3">
          <div className="flex w-full flex-wrap items-end justify-between gap-3">
            <FindChaptersPanel metadata={media.metadata} onResult={handleLookupResult} />
            <ShiftTimesFields
              shiftAmount={shiftAmount}
              showHelp
              applyDisabled={!shiftAmount || newChapters.length <= 1}
              onShiftAmountChange={handleShiftAmountChange}
              onApplyShift={handleApplyShift}
            />
            <div className="flex items-center gap-2">
              <Btn size="small" onClick={handleSetChaptersFromTracks}>
                {t('ButtonSetChaptersFromTracks')}
              </Btn>
              <HelpTooltipIcon text={t('MessageSetChaptersFromTracksDescription')} />
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
          <ChaptersModalTable
            scrollContainerRef={scrollContainerRef}
            chapters={newChapters}
            dirtyBaseline={dirtyBaseline}
            mediaDuration={mediaDuration}
            addChapterInput={addChapterInput}
            selectedKeys={selectedKeys}
            preview={preview}
            tracks={tracks}
            showMatchDebug={showChapterMatchDebug && chapterMatchDebugActive}
            chapterMatchDebug={chapterMatchDebug}
            onAddChapterInputChange={setAddChapterInput}
            onAddChapter={handleAddChapterFromInput}
            onToggleAllSelected={handleToggleAllChaptersSelected}
            onChapterCheckedChange={handleChapterCheckedChange}
            onChapterStartChange={handleChapterStartChange}
            onChapterTitleDraft={handleChapterTitleDraft}
            onChapterTitleCommit={handleChapterTitleCommit}
            onChapterRemove={handleChapterRemove}
            onChapterInsertBelow={handleChapterInsertBelow}
            onAdjustChapterStartTime={handleAdjustChapterStartTime}
            onRemoveSelected={handleRemoveSelected}
          />

          {isPending && (
            <div className="bg-bg/50 absolute inset-0 z-10 flex items-center justify-center">
              <LoadingIndicator variant="inline" />
            </div>
          )}
        </div>

        <div
          className={mergeClasses(
            'bg-bg border-border flex shrink-0 flex-wrap items-end gap-x-4 gap-y-3 border-t px-4 py-3 transition-shadow duration-200',
            footerShadow && 'box-shadow-md-up'
          )}
        >
          {lookupResult && lookupResultForPreview && (
            <div className="min-w-0 flex-1">
              <LookupComparison lookupResult={lookupResultForPreview} baselineCount={lookupBaselineCount} mediaDurationRounded={mediaDurationRounded} />
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {canMapChapterTitles && (
                  <div className="flex items-center gap-2">
                    <Checkbox value={mapChapterTitles} label={t('ButtonMapChapterTitles')} size="small" onChange={handleMapChapterTitlesChange} />
                    <HelpTooltipIcon text={t('MessageMapChapterTitles')} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox value={removeBranding} label={t('LabelRemoveAudibleBrandingShort')} size="small" onChange={handleRemoveBrandingChange} />
                  <HelpTooltipIcon text={t('LabelRemoveAudibleBranding')} />
                </div>
              </div>
            </div>
          )}
          <div className="ms-auto flex shrink-0 gap-3">
            <Btn
              size="small"
              disabled={footerDisabled}
              onClick={() => {
                destroyAudioEl()
                setConfirmState({
                  message: t('MessageDiscardChaptersConfirm'),
                  onConfirm: () => {
                    setConfirmState(null)
                    resetEditorChapters()
                  }
                })
              }}
            >
              {t('ButtonDiscardChanges')}
            </Btn>
            <Btn color="bg-success" size="small" loading={isPending} disabled={footerDisabled} onClick={() => handleSave()}>
              {t('ButtonSave')}
            </Btn>
          </div>
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
