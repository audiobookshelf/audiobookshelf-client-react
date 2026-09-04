'use client'

import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { type ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import AppBarBatchActionModals from '@/components/widgets/AppBarBatchActionModals'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useBookshelfSelectionOptional } from '@/contexts/BookshelfSelectionContext'
import { useUser } from '@/contexts/UserContext'
import { type AppBarBatchActionId, useAppBarBatchActions } from '@/hooks/useAppBarBatchActions'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getSelectionCountMessageKey, type SelectedMediaItem, type SelectionKind } from '@/lib/selectedMediaItem'
import type { MediaProgress } from '@/types/api'
import { useMemo } from 'react'

const countBadgeClasses = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 md:hidden'
const EMPTY_SELECTED_ITEMS: readonly SelectedMediaItem[] = []

function findProgressForSelectedItem(item: SelectedMediaItem, progressList: readonly MediaProgress[]): MediaProgress | undefined {
  if (item.episodeId) {
    return progressList.find((p) => (p.mediaItemId ?? p.episodeId) === item.episodeId)
  }
  return progressList.find((p) => p.libraryItemId === item.libraryItemId && !p.episodeId)
}

function useSelectionBatchState(selectedItems: readonly SelectedMediaItem[], mediaProgress: readonly MediaProgress[]) {
  return useMemo(() => {
    const allPlayable = selectedItems.length > 0 && selectedItems.every((item) => item.hasTracks)
    const allFinished =
      selectedItems.length > 0 &&
      selectedItems.every((item) => {
        const progress = findProgressForSelectedItem(item, mediaProgress)
        return Boolean(progress?.isFinished)
      })
    return { allPlayable, allFinished }
  }, [selectedItems, mediaProgress])
}

function useLibraryItemAdminMenuItems(
  selectionKind: SelectionKind,
  selectedCount: number,
  userIsAdminOrUp: boolean,
  userCanDownload: boolean,
  allPlayable: boolean
): ContextMenuDropdownItem[] {
  const t = useTypeSafeTranslations()

  return useMemo(() => {
    if (!userIsAdminOrUp) return []

    const items: ContextMenuDropdownItem[] = [{ text: t('ButtonQuickMatch'), action: 'quick-match' }]

    if (selectionKind === 'book' && allPlayable) {
      items.push({ text: t('ButtonQuickEmbedMetadata'), action: 'quick-embed' })
    }

    items.push({ text: t('ButtonReScan'), action: 'rescan' })

    if (userCanDownload && selectedCount <= 40) {
      items.push({ text: t('LabelDownload'), action: 'download' })
    }

    return items
  }, [allPlayable, selectionKind, selectedCount, t, userCanDownload, userIsAdminOrUp])
}

function useEpisodeBatchMenuItems(userCanDownload: boolean): ContextMenuDropdownItem[] {
  const t = useTypeSafeTranslations()

  return useMemo(() => {
    const items: ContextMenuDropdownItem[] = []
    if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
    return items
  }, [t, userCanDownload])
}

export default function AppBarSelectionOverlay({ libraryId }: { libraryId?: string }) {
  const t = useTypeSafeTranslations()
  const selection = useBookshelfSelectionOptional()
  const { user, userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const selectedItems = selection?.selectedItems ?? EMPTY_SELECTED_ITEMS
  const selectionKind = selection?.selectionKind ?? null
  const clearSelection = selection?.clearSelection
  const isMobile = useMediaQuery('max-md')

  const { allPlayable, allFinished } = useSelectionBatchState(selectedItems, user.mediaProgress)

  const { onBatchAction, processing, confirmState, closeConfirm, modalsProps } = useAppBarBatchActions({
    selectedItems,
    selectionKind: selectionKind ?? 'book',
    libraryId,
    allFinished,
    clearSelection
  })

  const handleBatchAction = (action: AppBarBatchActionId) => {
    onBatchAction(action)
  }

  const libraryItemAdminMenuItems = useLibraryItemAdminMenuItems(selectionKind ?? 'book', selectedItems.length, userIsAdminOrUp, userCanDownload, allPlayable)
  const episodeBatchMenuItems = useEpisodeBatchMenuItems(userCanDownload)

  const showAddToCollection = selectionKind === 'book' && userCanUpdate
  const showAddToPlaylist = (selectionKind === 'book' || selectionKind === 'episode') && userCanUpdate && allPlayable

  const libraryItemContextMenuItems = useMemo(() => {
    const items: ContextMenuDropdownItem[] = []

    if (isMobile && showAddToCollection) {
      items.push({ text: t('LabelAddToCollection'), action: 'add-to-collection' })
    }

    if (isMobile && showAddToPlaylist && selectionKind === 'book') {
      items.push({ text: t('LabelAddToPlaylist'), action: 'add-to-playlist' })
    }

    items.push(...libraryItemAdminMenuItems)
    return items
  }, [isMobile, libraryItemAdminMenuItems, selectionKind, showAddToCollection, showAddToPlaylist, t])

  const episodeContextMenuItems = useMemo(() => {
    const items: ContextMenuDropdownItem[] = []

    if (isMobile && showAddToPlaylist && selectionKind === 'episode') {
      items.push({ text: t('LabelAddToPlaylist'), action: 'add-to-playlist' })
    }

    items.push(...episodeBatchMenuItems)
    return items
  }, [episodeBatchMenuItems, isMobile, selectionKind, showAddToPlaylist, t])

  if (!selection || selectedItems.length === 0 || selectionKind === null) {
    return null
  }

  const selectionLabel = t(getSelectionCountMessageKey(selectionKind), { count: selectedItems.length })

  const showPlay = (selectionKind === 'book' || selectionKind === 'episode') && allPlayable
  const showMarkFinished = selectionKind === 'book' || selectionKind === 'episode'
  const showBatchEdit = userCanUpdate
  const showDelete = userCanDelete
  const controlsDisabled = processing

  return (
    <>
      <div className="bg-primary absolute inset-0 z-70 flex items-center px-4 md:px-6" role="toolbar" aria-label={selectionLabel}>
        <div className={countBadgeClasses} aria-label={selectionLabel} role="status">
          <span className="font-mono text-sm" aria-hidden="true">
            {selectedItems.length}
          </span>
        </div>
        <h1 className="hidden px-4 text-lg md:block md:text-2xl">{selectionLabel}</h1>
        <div className="grow" />

        <div className="flex items-center gap-1 md:gap-2">
          {showPlay && (
            <Tooltip text={t('ButtonPlay')} position="bottom">
              <Btn
                color="bg-success"
                size="small"
                className="h-9 w-9 items-center px-0 sm:w-auto sm:px-4"
                ariaLabel={t('ButtonPlay')}
                disabled={controlsDisabled}
                onClick={() => handleBatchAction('play')}
              >
                <span className="material-symbols fill text-2xl text-white sm:-ms-2 sm:pe-1" aria-hidden>
                  play_arrow
                </span>
                <span className="hidden sm:inline">{t('ButtonPlay')}</span>
              </Btn>
            </Tooltip>
          )}

          {showMarkFinished && (
            <Tooltip text={allFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} position="bottom">
              <ReadIconBtn size="small" isRead={allFinished} disabled={controlsDisabled} onClick={() => handleBatchAction('toggle-finished')} />
            </Tooltip>
          )}

          {showAddToCollection && (
            <Tooltip text={t('LabelAddToCollection')} position="bottom">
              <IconBtn size="small" ariaLabel={t('LabelAddToCollection')} disabled={controlsDisabled} onClick={() => handleBatchAction('add-to-collection')}>
                collections_bookmark
              </IconBtn>
            </Tooltip>
          )}

          {showAddToPlaylist && (
            <Tooltip text={t('LabelAddToPlaylist')} position="bottom">
              <IconBtn size="small" ariaLabel={t('LabelAddToPlaylist')} disabled={controlsDisabled} onClick={() => handleBatchAction('add-to-playlist')}>
                playlist_add
              </IconBtn>
            </Tooltip>
          )}

          {showBatchEdit && (
            <Tooltip text={t('LabelEdit')} position="bottom">
              <IconBtn
                size="small"
                ariaLabel={t('LabelEdit')}
                disabled={controlsDisabled}
                onClick={() => handleBatchAction('batch-edit')}
                className="bg-warning text-white"
              >
                edit
              </IconBtn>
            </Tooltip>
          )}

          {showDelete && (
            <Tooltip text={selectionKind === 'episode' ? t('MessageRemoveEpisodes', { 0: selectedItems.length }) : t('ButtonRemove')} position="bottom">
              <IconBtn
                size="small"
                ariaLabel={selectionKind === 'episode' ? t('MessageRemoveEpisodes', { 0: selectedItems.length }) : t('ButtonRemove')}
                disabled={controlsDisabled}
                onClick={() => handleBatchAction('delete')}
                className="bg-error text-white"
              >
                delete
              </IconBtn>
            </Tooltip>
          )}

          {selectionKind !== 'episode' && libraryItemContextMenuItems.length > 0 && (
            <ContextMenuDropdown
              items={libraryItemContextMenuItems}
              size="small"
              disabled={controlsDisabled}
              onAction={({ action }) => handleBatchAction(action as AppBarBatchActionId)}
            />
          )}

          {selectionKind === 'episode' && episodeContextMenuItems.length > 0 && (
            <ContextMenuDropdown
              items={episodeContextMenuItems}
              size="small"
              disabled={controlsDisabled}
              onAction={({ action }) => handleBatchAction(action as AppBarBatchActionId)}
            />
          )}

          <Tooltip text={t('LabelDeselectAll')} position="bottom">
            <IconBtn borderless ariaLabel={t('LabelDeselectAll')} disabled={processing} onClick={() => clearSelection?.()} className="text-3xl sm:ms-1">
              close
            </IconBtn>
          </Tooltip>
        </div>
      </div>

      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          message={confirmState.message}
          checkboxLabel={confirmState.checkboxLabel}
          yesButtonText={confirmState.yesButtonText}
          yesButtonClassName={confirmState.yesButtonClassName}
          processing={processing}
          onClose={closeConfirm}
          onConfirm={(value) => confirmState.onConfirm(value)}
        />
      )}

      <AppBarBatchActionModals {...modalsProps} />
    </>
  )
}
