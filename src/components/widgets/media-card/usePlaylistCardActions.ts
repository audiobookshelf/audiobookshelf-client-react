'use client'

import { deletePlaylistAction } from '@/app/actions/playlistActions'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Playlist } from '@/types/api'
import { useCallback, useMemo, useState, useTransition, type ReactNode } from 'react'
import { MediaCardMoreMenuItem } from './MediaCardMoreMenu'

interface ConfirmState {
  isOpen: boolean
  message: string | ReactNode
  checkboxLabel?: string
  yesButtonText?: string
  yesButtonClassName?: string
  onConfirm: (checkboxValue?: boolean) => void
}

interface UsePlaylistCardActionsProps {
  playlist: Playlist
  userCanUpdate: boolean
  userCanDelete: boolean
}

export function usePlaylistCardActions({
  playlist,
  userCanUpdate,
  userCanDelete
}: UsePlaylistCardActionsProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [processing, setProcessing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const handleMoreAction = useCallback(
    (action: string) => {
      if (action === 'delete') {
        setConfirmState({
          isOpen: true,
          message: t('MessageConfirmRemovePlaylist', { 0: playlist.name }),
          yesButtonText: t('ButtonDelete'),
          yesButtonClassName: 'bg-error',
          onConfirm: () => {
            setConfirmState(null)
            startTransition(async () => {
              try {
                setProcessing(true)
                await deletePlaylistAction(playlist.id)
                showToast(t('ToastPlaylistRemoveSuccess'), { type: 'success' })
              } catch (error) {
                console.error('Failed to delete playlist', error)
                showToast(t('ToastRemoveFailed'), { type: 'error' })
              } finally {
                setProcessing(false)
              }
            })
          }
        })
      }
    },
    [playlist.id, playlist.name, showToast, t]
  )

  const moreMenuItems = useMemo<MediaCardMoreMenuItem[]>(() => {
    const items: MediaCardMoreMenuItem[] = []

    // Delete playlist - requires delete permission or update permission (since playlists are user-owned)
    if (userCanDelete || userCanUpdate) {
      items.push({
        text: t('ButtonDelete'),
        func: 'delete'
      })
    }

    return items
  }, [t, userCanDelete, userCanUpdate])

  const closeConfirm = useCallback(() => {
    setConfirmState(null)
  }, [])

  return {
    processing: processing || isPending,
    isPending,
    confirmState,
    closeConfirm,
    handleMoreAction,
    moreMenuItems
  }
}

