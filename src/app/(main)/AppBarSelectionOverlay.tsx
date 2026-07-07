'use client'

import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { type ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { useBookshelfSelection } from '@/contexts/BookshelfSelectionContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getSelectionCountMessageKey, type SelectedMediaItem, type SelectionKind } from '@/lib/selectedMediaItem'
import type { MediaProgress } from '@/types/api'
import { useCallback, useMemo } from 'react'

type BatchActionId =
  | 'play'
  | 'toggle-finished'
  | 'add-to-collection'
  | 'add-to-playlist'
  | 'batch-edit'
  | 'delete'
  | 'quick-match'
  | 'quick-embed'
  | 'rescan'
  | 'download'
  | 'match'
  | 'more-info'

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

function useLibraryItemAdminMenuItems(selectionKind: SelectionKind, selectedCount: number, userIsAdminOrUp: boolean): ContextMenuDropdownItem[] {
  const t = useTypeSafeTranslations()

  return useMemo(() => {
    if (!userIsAdminOrUp) return []

    const items: ContextMenuDropdownItem[] = [{ text: t('ButtonQuickMatch'), action: 'quick-match' }]

    if (selectionKind === 'book') {
      items.push({ text: t('ButtonQuickEmbedMetadata'), action: 'quick-embed' })
    }

    items.push({ text: t('ButtonReScan'), action: 'rescan' })

    if (selectedCount <= 40) {
      items.push({ text: t('LabelDownload'), action: 'download' })
    }

    return items
  }, [selectionKind, selectedCount, t, userIsAdminOrUp])
}

function useEpisodeBatchMenuItems(userCanUpdate: boolean, userCanDownload: boolean, userIsAdminOrUp: boolean): ContextMenuDropdownItem[] {
  const t = useTypeSafeTranslations()

  return useMemo(() => {
    const items: ContextMenuDropdownItem[] = []
    if (userCanUpdate) items.push({ text: t('HeaderMatch'), action: 'match' })
    if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
    if (userIsAdminOrUp) items.push({ text: t('LabelMoreInfo'), action: 'more-info' })
    return items
  }, [t, userCanDownload, userCanUpdate, userIsAdminOrUp])
}

export default function AppBarSelectionOverlay() {
  const t = useTypeSafeTranslations()
  const { user, userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const { selectedItems, selectionKind, clearSelection } = useBookshelfSelection()

  const { allPlayable, allFinished } = useSelectionBatchState(selectedItems, user.mediaProgress)

  const onBatchAction = useCallback((action: BatchActionId) => {
    void action
    // TODO: wire batch handlers (play, progress, collection, playlist, edit, delete, admin tools)
  }, [])

  const libraryItemAdminMenuItems = useLibraryItemAdminMenuItems(selectionKind ?? 'book', selectedItems.length, userIsAdminOrUp)
  const episodeBatchMenuItems = useEpisodeBatchMenuItems(userCanUpdate, userCanDownload, userIsAdminOrUp)

  if (selectedItems.length === 0 || selectionKind === null) {
    return null
  }

  const selectionLabel = t(getSelectionCountMessageKey(selectionKind), { count: selectedItems.length })

  const showPlay = (selectionKind === 'book' || selectionKind === 'episode') && allPlayable
  const showMarkFinished = selectionKind === 'book' || selectionKind === 'episode'
  const showAddToCollection = selectionKind === 'book' && userCanUpdate
  const showAddToPlaylist = selectionKind === 'episode' && userCanUpdate
  const showBatchEdit = selectionKind !== 'episode' && userCanUpdate
  const showDelete = userCanDelete

  return (
    <div
      className="bg-primary absolute inset-0 z-70 flex items-center px-4 md:px-6"
      role="toolbar"
      aria-label={selectionLabel}
    >
      <h1 className="px-4 text-lg md:text-2xl">{selectionLabel}</h1>
      <div className="grow" />

      <div className="flex items-center gap-1 md:gap-1.5">
        {showPlay && (
          <Btn color="bg-success" size="small" className="me-1 hidden h-9 items-center sm:inline-flex" onClick={() => onBatchAction('play')}>
            <span className="material-symbols fill -ms-2 pe-1 text-2xl text-white">play_arrow</span>
            {t('ButtonPlay')}
          </Btn>
        )}

        {showPlay && (
          <Tooltip text={t('ButtonPlay')} position="bottom">
            <IconBtn size="small" borderless className="bg-success text-white sm:hidden" ariaLabel={t('ButtonPlay')} onClick={() => onBatchAction('play')}>
              play_arrow
            </IconBtn>
          </Tooltip>
        )}

        {showMarkFinished && (
          <Tooltip text={allFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} position="bottom">
            <ReadIconBtn size="small" isRead={allFinished} onClick={() => onBatchAction('toggle-finished')} className="mx-0.5" />
          </Tooltip>
        )}

        {showAddToCollection && (
          <Tooltip text={t('LabelAddToCollection')} position="bottom">
            <IconBtn size="small" borderless ariaLabel={t('LabelAddToCollection')} onClick={() => onBatchAction('add-to-collection')} className="mx-0.5">
              collections_bookmark
            </IconBtn>
          </Tooltip>
        )}

        {showAddToPlaylist && (
          <Tooltip text={t('LabelAddToPlaylist')} position="bottom">
            <IconBtn size="small" borderless ariaLabel={t('LabelAddToPlaylist')} onClick={() => onBatchAction('add-to-playlist')} className="mx-0.5">
              playlist_add
            </IconBtn>
          </Tooltip>
        )}

        {showBatchEdit && (
          <Tooltip text={t('LabelEdit')} position="bottom">
            <IconBtn
              size="small"
              borderless
              ariaLabel={t('LabelEdit')}
              onClick={() => onBatchAction('batch-edit')}
              className="mx-0.5 bg-warning text-white"
            >
              edit
            </IconBtn>
          </Tooltip>
        )}

        {selectionKind === 'episode' && userCanUpdate && (
          <Tooltip text={t('LabelEdit')} position="bottom">
            <IconBtn size="small" borderless ariaLabel={t('LabelEdit')} onClick={() => onBatchAction('batch-edit')} className="mx-0.5">
              edit
            </IconBtn>
          </Tooltip>
        )}

        {showDelete && (
          <Tooltip text={selectionKind === 'episode' ? t('MessageRemoveEpisodes', { 0: selectedItems.length }) : t('ButtonRemove')} position="bottom">
            <IconBtn
              size="small"
              borderless
              ariaLabel={selectionKind === 'episode' ? t('MessageRemoveEpisodes', { 0: selectedItems.length }) : t('ButtonRemove')}
              onClick={() => onBatchAction('delete')}
              className="mx-0.5 bg-error text-white"
            >
              delete
            </IconBtn>
          </Tooltip>
        )}

        {selectionKind !== 'episode' && libraryItemAdminMenuItems.length > 0 && (
          <ContextMenuDropdown
            items={libraryItemAdminMenuItems}
            borderless
            size="small"
            className="mx-0.5"
            onAction={({ action }) => onBatchAction(action as BatchActionId)}
          />
        )}

        {selectionKind === 'episode' && episodeBatchMenuItems.length > 0 && (
          <ContextMenuDropdown
            items={episodeBatchMenuItems}
            borderless
            size="small"
            className="mx-0.5"
            onAction={({ action }) => onBatchAction(action as BatchActionId)}
          />
        )}

        <Tooltip text={t('LabelDeselectAll')} position="bottom">
          <IconBtn borderless ariaLabel={t('LabelDeselectAll')} onClick={clearSelection} className="ms-1 text-3xl">
            close
          </IconBtn>
        </Tooltip>
      </div>
    </div>
  )
}
