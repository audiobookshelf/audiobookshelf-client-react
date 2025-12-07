'use client'

import { createPlaylistFromCollectionAction, deleteCollectionAction } from '@/app/actions/collectionActions'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Collection, RssFeed } from '@/types/api'
import { useRouter } from 'next/navigation'
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

interface UseCollectionCardActionsProps {
  collection: Collection
  rssFeed: RssFeed | null
  userCanUpdate: boolean
  userCanDelete: boolean
  userIsAdmin: boolean
  onOpenRssFeedModal?: () => void
}

export function useCollectionCardActions({
  collection,
  rssFeed,
  userCanUpdate,
  userCanDelete,
  userIsAdmin,
  onOpenRssFeedModal
}: UseCollectionCardActionsProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const [processing, setProcessing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const handleMoreAction = useCallback(
    (action: string) => {
      if (action === 'createPlaylist') {
        startTransition(async () => {
          try {
            setProcessing(true)
            const playlist = await createPlaylistFromCollectionAction(collection.id)
            if (playlist?.id) {
              showToast(t('ToastPlaylistCreateSuccess'), { type: 'success' })
              router.push(`/playlist/${playlist.id}`)
            }
          } catch (error) {
            console.error('Failed to create playlist from collection', error)
            showToast(t('ToastPlaylistCreateFailed'), { type: 'error' })
          } finally {
            setProcessing(false)
          }
        })
      } else if (action === 'openRssFeed') {
        onOpenRssFeedModal?.()
      } else if (action === 'delete') {
        setConfirmState({
          isOpen: true,
          message: t('MessageConfirmRemoveCollection', { 0: collection.name }),
          yesButtonText: t('ButtonDelete'),
          yesButtonClassName: 'bg-error',
          onConfirm: () => {
            setConfirmState(null)
            startTransition(async () => {
              try {
                setProcessing(true)
                await deleteCollectionAction(collection.id)
                showToast(t('ToastCollectionRemoveSuccess'), { type: 'success' })
              } catch (error) {
                console.error('Failed to delete collection', error)
                showToast(t('ToastRemoveFailed'), { type: 'error' })
              } finally {
                setProcessing(false)
              }
            })
          }
        })
      }
    },
    [collection.id, collection.name, onOpenRssFeedModal, router, showToast, t]
  )

  const moreMenuItems = useMemo<MediaCardMoreMenuItem[]>(() => {
    const items: MediaCardMoreMenuItem[] = []

    // Create playlist from collection - requires update permission
    if (userCanUpdate) {
      items.push({
        text: t('MessagePlaylistCreateFromCollection'),
        func: 'createPlaylist'
      })
    }

    // Open RSS Feed - show if admin or if collection has an RSS feed
    if (userIsAdmin || rssFeed) {
      items.push({
        text: t('LabelOpenRSSFeed'),
        func: 'openRssFeed'
      })
    }

    // Delete collection
    if (userCanDelete) {
      items.push({
        text: t('ButtonDelete'),
        func: 'delete'
      })
    }

    return items
  }, [rssFeed, t, userCanDelete, userCanUpdate, userIsAdmin])

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
