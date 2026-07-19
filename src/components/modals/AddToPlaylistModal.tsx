'use client'

import { fetchPlaylistsAction } from '@/app/actions/libraryActions'
import { batchAddToPlaylistAction, batchRemoveFromPlaylistAction, createPlaylistAction } from '@/app/actions/playlistActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import MoreInfoIcon from '@/components/ui/MoreInfoIcon'
import PlaylistGroupCover from '@/components/widgets/media-card/PlaylistGroupCover'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiError } from '@/lib/apiErrors'
import { getAddToPlaylistBatchLabelKey, getSelectionCountMessageKey, type SelectionKind } from '@/lib/selectedMediaItem'
import type { Playlist, PlaylistItemPayload } from '@/types/api'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type PlaylistRow = Playlist & { allItemsIncluded: boolean }

interface AddToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  libraryId: string
  items: PlaylistItemPayload[]
  /** Single-item outer header title; ignored when multiple items are selected */
  headerTitle?: string
  /** Used for batch outer header when multiple items are selected */
  selectionKind?: SelectionKind
}

function playlistIncludesAllItems(playlist: Playlist, items: readonly PlaylistItemPayload[]) {
  const playlistItems = playlist.items ?? []
  return items.every((item) =>
    playlistItems.some((playlistItem) => playlistItem.libraryItemId === item.libraryItemId && (playlistItem.episodeId ?? null) === (item.episodeId ?? null))
  )
}

export default function AddToPlaylistModal({ isOpen, onClose, libraryId, items, headerTitle, selectionKind }: AddToPlaylistModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const loadedLibraryIdRef = useRef<string | null>(null)
  const showToastRef = useRef(showToast)
  const tRef = useRef(t)
  showToastRef.current = showToast
  tRef.current = t

  const coverWidth = 64
  const coverHeight = 64
  const isBatch = items.length > 1
  const itemCount = items.length

  const sortedPlaylists = useMemo((): PlaylistRow[] => {
    return [...playlists]
      .map(
        (playlist): PlaylistRow => ({
          ...playlist,
          allItemsIncluded: playlistIncludesAllItems(playlist, items)
        })
      )
      .sort((a, b) => {
        if (a.allItemsIncluded !== b.allItemsIncluded) {
          return a.allItemsIncluded ? -1 : 1
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
  }, [items, playlists])

  useEffect(() => {
    if (!isOpen) {
      loadedLibraryIdRef.current = null
      return
    }

    const isFreshOpen = loadedLibraryIdRef.current !== libraryId
    loadedLibraryIdRef.current = libraryId

    if (isFreshOpen) {
      setPlaylists([])
      setNewPlaylistName('')
      setLoadingInitial(true)
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetchPlaylistsAction(libraryId, '')
        if (!cancelled) setPlaylists(res.results)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load playlists', error)
          showToastRef.current(tRef.current('ToastFailedToLoadData'), { type: 'error' })
          if (isFreshOpen) setPlaylists([])
        }
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, libraryId])

  const mergeUpdatedPlaylist = useCallback((updated: Playlist) => {
    setPlaylists((prev) => prev.map((playlist) => (playlist.id === updated.id ? updated : playlist)))
  }, [])

  const handleAdd = useCallback(
    (playlist: Playlist) => {
      setIsMutating(true)
      void (async () => {
        try {
          const updated = await batchAddToPlaylistAction(playlist.id, [...items])
          mergeUpdatedPlaylist(updated)
          if (isBatch) showToast(t('ToastPlaylistUpdateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to add to playlist', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [isBatch, items, mergeUpdatedPlaylist, showToast, t]
  )

  const handleRemove = useCallback(
    (playlist: Playlist) => {
      setIsMutating(true)
      void (async () => {
        try {
          const updated = await batchRemoveFromPlaylistAction(playlist.id, [...items])
          mergeUpdatedPlaylist(updated)
          if (isBatch) showToast(t('ToastPlaylistUpdateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to remove from playlist', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [isBatch, items, mergeUpdatedPlaylist, showToast, t]
  )

  const handleCreatePlaylist = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const name = newPlaylistName.trim()
      if (!name) return

      setIsMutating(true)
      void (async () => {
        try {
          const created = await createPlaylistAction({
            libraryId,
            name,
            items: [...items]
          })
          setPlaylists((prev) => {
            if (prev.some((playlist) => playlist.id === created.id)) {
              return prev.map((playlist) => (playlist.id === created.id ? created : playlist))
            }
            return [...prev, created]
          })
          setNewPlaylistName('')
          if (isBatch) showToast(t('ToastPlaylistCreateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to create playlist', error)
          const message = error instanceof ApiError ? error.message : t('ToastPlaylistCreateFailed')
          showToast(message, { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [isBatch, items, libraryId, newPlaylistName, showToast, t]
  )

  const outerHeaderText = isBatch ? t(getSelectionCountMessageKey(selectionKind ?? 'book'), { count: itemCount }) : (headerTitle ?? '')

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="max-w-[calc(100vw-4rem)] truncate text-xl font-semibold text-white" title={outerHeaderText}>
        {outerHeaderText}
      </p>
    </div>
  )

  const controlsDisabled = loadingInitial || isMutating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      processing={loadingInitial && playlists.length === 0}
      outerContent={outerContent}
      className="max-w-lg sm:max-w-lg md:max-w-lg lg:max-w-lg"
    >
      <div className="max-h-[80vh] w-full overflow-x-hidden overflow-y-auto rounded-lg">
        {isOpen && (
          <>
            <div className="px-4 pt-4 pb-2">
              <h1 className="text-lg font-semibold">
                {isBatch ? t(getAddToPlaylistBatchLabelKey(selectionKind ?? 'book'), { 0: itemCount }) : t('LabelAddToPlaylist')}
              </h1>
            </div>

            <div className="max-h-96 w-full overflow-x-hidden overflow-y-auto pt-4 pb-2">
              <div>
                {sortedPlaylists.map((playlist) => {
                  const included = playlist.allItemsIncluded
                  const playlistItems = playlist.items ?? []
                  return (
                    <div key={playlist.id} className="hover:bg-dropdown-item-hover relative flex items-center justify-start px-4 py-2">
                      {included && <div className="bg-success absolute start-0 top-0 z-10 h-full w-1" aria-hidden />}
                      <div className="w-20 max-w-20 shrink-0 text-center">
                        <PlaylistGroupCover items={playlistItems} width={coverWidth} height={coverHeight} />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden px-2">
                        <Link
                          href={`/library/${libraryId}/playlist/${playlist.id}`}
                          className="cursor-pointer truncate ps-2 pe-2 hover:underline"
                          onClick={() => onClose()}
                        >
                          {playlist.name}
                        </Link>
                      </div>
                      <div className="flex h-full shrink-0 items-center justify-end ps-2">
                        {included ? (
                          <IconBtn
                            ariaLabel={t('ButtonRemove')}
                            size="auto"
                            outlined={false}
                            className="bg-error h-9 min-w-10 px-3 text-white"
                            disabled={controlsDisabled}
                            onClick={() => handleRemove(playlist)}
                          >
                            remove
                          </IconBtn>
                        ) : (
                          <IconBtn
                            ariaLabel={t('ButtonAdd')}
                            size="auto"
                            outlined={false}
                            className="bg-success h-9 min-w-10 px-3 text-white"
                            disabled={controlsDisabled}
                            onClick={() => handleAdd(playlist)}
                          >
                            add
                          </IconBtn>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {!loadingInitial && playlists.length === 0 && (
              <div className="flex h-32 items-center justify-center px-4 text-center sm:px-6">
                <div>
                  <p className="mb-2 text-xl">{t('MessageNoUserPlaylists')}</p>
                  <div className="text-foreground-muted flex items-center justify-center gap-2 text-sm">
                    <p>{t('MessageNoUserPlaylistsHelp')}</p>
                    <MoreInfoIcon moreInfoUrl="https://www.audiobookshelf.org/guides/collections" size="xl" />
                  </div>
                </div>
              </div>
            )}

            <div className="border-border h-px w-full border-t" />

            <form onSubmit={handleCreatePlaylist}>
              <div className="flex items-center px-4 py-2 text-center sm:px-6">
                <div className="grow px-2">
                  <TextInput
                    value={newPlaylistName}
                    placeholder={t('PlaceholderNewPlaylist')}
                    onChange={setNewPlaylistName}
                    disabled={controlsDisabled}
                    className="w-full"
                  />
                </div>
                <Btn type="submit" color="bg-success" size="small" className="h-10 shrink-0" disabled={controlsDisabled || !newPlaylistName.trim()}>
                  {t('ButtonCreate')}
                </Btn>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
