'use client'

import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useChapterEditor } from '@/hooks/useChapterEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { hasNonPlaceholderChapters } from '@/lib/chapters/chapterEditorUtils'
import type { BookLibraryItem } from '@/types/api'
import AddMultipleChaptersModal from './AddMultipleChaptersModal'
import AudioTracksPanel from './AudioTracksPanel'
import ChaptersEditHeader from './ChaptersEditHeader'
import ChaptersListSection from './ChaptersListSection'
import ChaptersSectionHeader from './ChaptersSectionHeader'
import ChaptersToolbar from './ChaptersToolbar'
import FindChaptersModal from './FindChaptersModal'
import ShiftTimesPanel from './ShiftTimesPanel'

interface ChaptersEditClientProps {
  libraryItem: BookLibraryItem
}

export default function ChaptersEditClient({ libraryItem: initialLibraryItem }: ChaptersEditClientProps) {
  const t = useTypeSafeTranslations()
  const editor = useChapterEditor({ initialLibraryItem })

  const {
    libraryItem,
    title,
    media,
    mediaDuration,
    mediaDurationRounded,
    savedChapters,
    tracks,
    newChapters,
    hasChanges,
    lockedChapters,
    showSecondInputs,
    showShiftTimes,
    shiftAmount,
    bulkChapterInput,
    showFindChaptersModal,
    removeBranding,
    showAddMultipleChaptersModal,
    detectedPattern,
    bulkChapterCount,
    isEditModalOpen,
    confirmState,
    isPending,
    preview,
    allChaptersLocked,
    isStreaming,
    setShowSecondInputs,
    setShowShiftTimes,
    setShiftAmount,
    setBulkChapterInput,
    setShowFindChaptersModal,
    setRemoveBranding,
    setShowAddMultipleChaptersModal,
    setBulkChapterCount,
    setIsEditModalOpen,
    setConfirmState,
    handleSave,
    handleRemoveAll,
    handleShiftChapterTimes,
    toggleChapterLock,
    toggleAllChaptersLock,
    handleBulkChapterAdd,
    handleAddBulkChapters,
    handleApplyTitles,
    handleApplyChapters,
    handleAdjustChapterStartTime,
    handleChapterStartChange,
    handleChapterTitleDraft,
    handleChapterTitleCommit,
    handleChapterIncrementTime,
    handleChapterRemove,
    handleChapterInsertBelow,
    handleSetChaptersFromTracks,
    handleLibraryItemSaved,
    resetEditorChapters
  } = editor

  return (
    <div className={mergeClasses('bg-bg relative min-h-full overflow-y-auto', isStreaming && 'streaming')}>
      <ChaptersEditHeader
        libraryId={libraryItem.libraryId}
        itemId={libraryItem.id}
        title={title}
        mediaDurationRounded={mediaDurationRounded}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <div className="flex flex-wrap-reverse justify-center px-4 py-4 min-[1120px]:flex-nowrap">
        <div className="w-full max-w-3xl py-4">
          <ChaptersSectionHeader showSecondInputs={showSecondInputs} onShowSecondInputsChange={setShowSecondInputs} />

          <ChaptersToolbar
            chapterCount={newChapters.length}
            showRemoveAll={hasNonPlaceholderChapters(newChapters)}
            hasChanges={hasChanges}
            showShiftTimes={showShiftTimes}
            onRemoveAll={handleRemoveAll}
            onToggleShiftTimes={() => setShowShiftTimes((v) => !v)}
            onLookup={() => setShowFindChaptersModal(true)}
            onReset={() =>
              setConfirmState({
                message: t('MessageResetChaptersConfirm'),
                onConfirm: () => {
                  setConfirmState(null)
                  resetEditorChapters()
                }
              })
            }
            onSave={handleSave}
          />

          {showShiftTimes && (
            <ShiftTimesPanel
              shiftAmount={shiftAmount}
              onShiftAmountChange={setShiftAmount}
              onShift={handleShiftChapterTimes}
              onClose={() => setShowShiftTimes(false)}
            />
          )}

          <ChaptersListSection
            newChapters={newChapters}
            mediaDuration={mediaDuration}
            showSecondInputs={showSecondInputs}
            bulkChapterInput={bulkChapterInput}
            lockedChapters={lockedChapters}
            allChaptersLocked={allChaptersLocked}
            preview={preview}
            tracks={tracks}
            onToggleAllChaptersLock={toggleAllChaptersLock}
            onBulkChapterInputChange={setBulkChapterInput}
            onBulkChapterAdd={handleBulkChapterAdd}
            onChapterStartChange={handleChapterStartChange}
            onChapterTitleDraft={handleChapterTitleDraft}
            onChapterTitleCommit={handleChapterTitleCommit}
            onChapterIncrementTime={handleChapterIncrementTime}
            onToggleChapterLock={toggleChapterLock}
            onChapterRemove={handleChapterRemove}
            onChapterInsertBelow={handleChapterInsertBelow}
            onAdjustChapterStartTime={handleAdjustChapterStartTime}
          />
        </div>

        <AudioTracksPanel
          tracks={tracks}
          currentTrackIndex={preview.currentTrackIndex}
          isPlayingChapter={preview.isPlayingChapter}
          onSetChaptersFromTracks={handleSetChaptersFromTracks}
        />
      </div>

      {isPending && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25">
          <LoadingIndicator />
        </div>
      )}

      {showFindChaptersModal && (
        <FindChaptersModal
          isOpen
          metadata={media.metadata}
          mediaDuration={mediaDuration}
          mediaDurationRounded={mediaDurationRounded}
          savedChapterCount={savedChapters.length}
          removeBranding={removeBranding}
          onRemoveBrandingChange={setRemoveBranding}
          onClose={() => setShowFindChaptersModal(false)}
          onApplyTitles={handleApplyTitles}
          onApplyChapters={handleApplyChapters}
        />
      )}

      {showAddMultipleChaptersModal && (
        <AddMultipleChaptersModal
          isOpen
          detectedPattern={detectedPattern}
          bulkChapterCount={bulkChapterCount}
          onBulkChapterCountChange={setBulkChapterCount}
          onClose={() => setShowAddMultipleChaptersModal(false)}
          onConfirm={handleAddBulkChapters}
        />
      )}

      {confirmState && <ConfirmDialog isOpen message={confirmState.message} onClose={() => setConfirmState(null)} onConfirm={() => confirmState.onConfirm()} />}

      {isEditModalOpen && (
        <LibraryItemEditModal
          isOpen
          libraryItem={libraryItem}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={(updated) => {
            if (updated.mediaType === 'book') {
              handleLibraryItemSaved(updated as BookLibraryItem)
            }
          }}
        />
      )}
    </div>
  )
}
