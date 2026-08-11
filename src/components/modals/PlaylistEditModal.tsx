'use client'

import { deletePlaylistAction, updatePlaylistAction } from '@/app/actions/playlistActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Playlist } from '@/types/api'
import { useCallback, useEffect, useState, useTransition } from 'react'
import PlaylistGroupCover from '../widgets/media-card/PlaylistGroupCover'

interface PlaylistEditModalProps {
  isOpen: boolean
  playlist: Playlist
  onClose: () => void
  onSaved?: (playlist: Playlist) => void
  /** Called after the playlist is deleted successfully (e.g. navigate away from the detail page). */
  onDeleted?: () => void
}

export default function PlaylistEditModal({ isOpen, playlist, onClose, onSaved, onDeleted }: PlaylistEditModalProps) {
  const t = useTypeSafeTranslations()
  const { userCanDelete } = useUser()
  const { showToast } = useGlobalToast()
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description ?? '')
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(playlist.name)
      setDescription(playlist.description ?? '')
      setConfirmOpen(false)
    }
  }, [isOpen, playlist.name, playlist.description])

  const hasChanges = name.trim() !== playlist.name || (description.trim() || '') !== (playlist.description ?? '')
  const coverWidth = 200
  const coverHeight = 200

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      showToast(t('ToastNameRequired'), { type: 'error' })
      return
    }
    if (!hasChanges) {
      onClose()
      return
    }
    startTransition(async () => {
      try {
        const updated = await updatePlaylistAction(playlist.id, {
          name: name.trim(),
          description: description.trim() || undefined
        })
        showToast(t('ToastPlaylistUpdateSuccess'), { type: 'success' })
        onSaved?.(updated)
        onClose()
      } catch (error) {
        console.error('Failed to update playlist', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }, [description, hasChanges, name, onClose, onSaved, playlist.id, showToast, t])

  const handleRemove = useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const handleRemoveConfirm = useCallback(() => {
    startTransition(async () => {
      try {
        await deletePlaylistAction(playlist.id)
        showToast(t('ToastPlaylistRemoveSuccess'), { type: 'success' })
        setConfirmOpen(false)
        onClose()
        onDeleted?.()
      } catch (error) {
        console.error('Failed to delete playlist', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      }
    })
  }, [playlist.id, onClose, onDeleted, showToast, t])

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="text-xl text-white">{t('HeaderPlaylist')}</h2>
    </div>
  )

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent}>
        <div className="flex max-h-[90vh] flex-col">
          <div className="space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex justify-center sm:justify-start">
                <PlaylistGroupCover items={playlist.items ?? []} width={coverWidth} height={coverHeight} />
              </div>
              <div className="flex-1 space-y-4">
                <TextInput label={t('LabelName')} value={name} placeholder={t('PlaceholderNewPlaylist')} onChange={setName} trimWhitespace />
                <TextareaInput label={t('LabelDescription')} value={description} rows={4} onChange={setDescription} trimWhitespace />
              </div>
            </div>
          </div>
          <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-4 sm:px-6">
            {userCanDelete && (
              <Btn color="bg-error" size="small" onClick={handleRemove} disabled={isPending}>
                {t('ButtonRemove')}
              </Btn>
            )}
            <div className="grow" />
            <Btn size="small" onClick={handleSave} disabled={isPending || !hasChanges}>
              {t('ButtonSave')}
            </Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        message={t('MessageConfirmRemovePlaylist', { 0: playlist.name })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error"
        processing={isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRemoveConfirm}
      />
    </>
  )
}
