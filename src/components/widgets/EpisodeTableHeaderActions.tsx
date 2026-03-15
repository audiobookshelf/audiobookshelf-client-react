import { batchUpdateMediaFinishedAction, deleteLibraryItemMediaEpisodeAction } from '@/app/actions/mediaActions'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog, { type ConfirmState } from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useState, useTransition } from 'react'

interface EpisodeTableHeaderActionsProps {
  isSelectionMode: boolean
  selectedEpisodes: Set<string>
  allSelectedEpisodesFinished: boolean
  libraryItemId: string
  onClearSelection: () => void
  onFindEpisodes?: () => void
  isFetchingRSSFeed?: boolean
}

export default function EpisodeTableHeaderActions({
  isSelectionMode,
  selectedEpisodes,
  allSelectedEpisodesFinished,
  libraryItemId,
  onClearSelection,
  onFindEpisodes,
  isFetchingRSSFeed
}: EpisodeTableHeaderActionsProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  if (isSelectionMode) {
    const handleRemoveClick = () => {
      setConfirmState({
        isOpen: true,
        message: t('MessageConfirmRemoveEpisodes', { count: selectedEpisodes.size }),
        checkboxLabel: t('LabelDeleteFromFileSystemCheckbox'),
        yesButtonText: t('ButtonDelete'),
        yesButtonClassName: 'bg-error',
        onConfirm: (hardDelete?: boolean) => {
          setConfirmState(null)
          startTransition(async () => {
            try {
              for (const episodeId of Array.from(selectedEpisodes)) {
                await deleteLibraryItemMediaEpisodeAction(libraryItemId, episodeId, !!hardDelete)
              }
              onClearSelection()
            } catch (err: unknown) {
              console.error('Failed to batch remove episodes', err)
              showToast(t('ToastEpisodeBatchDeleteFailed'), { type: 'error' })
            }
          })
        }
      })
    }

    return (
      <div className="flex items-center gap-2">
        <Tooltip position="top" text={allSelectedEpisodesFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')}>
          <ReadIconBtn
            size="small"
            isRead={allSelectedEpisodesFinished}
            onClick={() => {
              const markState = !allSelectedEpisodesFinished
              startTransition(async () => {
                try {
                  await batchUpdateMediaFinishedAction(
                    Array.from(selectedEpisodes).map((episodeId) => ({
                      libraryItemId,
                      episodeId,
                      isFinished: markState
                    }))
                  )
                } catch (error) {
                  console.error('Failed to batch update selected episodes', error)
                  showToast(t('ToastFailedToUpdate'), { type: 'error' })
                } finally {
                  onClearSelection()
                }
              })
            }}
          />
        </Tooltip>

        {/* Desktop Actions */}
        <Btn color="bg-error" size="small" disabled={isPending} className="hidden sm:inline-flex" onClick={handleRemoveClick}>
          {t('MessageRemoveEpisodes', { 0: selectedEpisodes.size })}
        </Btn>
        <Btn size="small" className="hidden sm:inline-flex" onClick={onClearSelection} disabled={isPending}>
          {t('ButtonCancel')}
        </Btn>

        {/* Mobile Actions */}
        <div className="relative sm:hidden">
          <IconBtn
            size="small"
            disabled={isPending}
            ariaLabel={t('MessageRemoveEpisodes', { 0: selectedEpisodes.size })}
            className="bg-error text-white"
            onClick={handleRemoveClick}
          >
            delete
          </IconBtn>
          {selectedEpisodes.size > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-error border border-error text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full px-1 pointer-events-none shadow-sm">
              {selectedEpisodes.size}
            </span>
          )}
        </div>
        <IconBtn size="small" disabled={isPending} className="sm:hidden" ariaLabel={t('ButtonCancel')} onClick={onClearSelection}>
          close
        </IconBtn>

        {confirmState && (
          <ConfirmDialog
            isOpen={confirmState.isOpen}
            message={confirmState.message}
            checkboxLabel={confirmState.checkboxLabel}
            yesButtonText={confirmState.yesButtonText}
            yesButtonClassName={confirmState.yesButtonClassName}
            onClose={() => setConfirmState(null)}
            onConfirm={(value) => confirmState.onConfirm(value)}
          />
        )}
      </div>
    )
  }

  if (!onFindEpisodes) return null

  return (
    <Btn size="small" onClick={onFindEpisodes} loading={isFetchingRSSFeed}>
      {t('LabelFindEpisodes')}&nbsp;<span className="material-symbols">podcasts</span>
    </Btn>
  )
}
