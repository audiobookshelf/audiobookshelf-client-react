'use client'

import { updatePlaylistAction } from '@/app/actions/playlistActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Playlist } from '@/types/api'
import { useCallback, useEffect, useState, useTransition } from 'react'

interface PlaylistEditModalProps {
  isOpen: boolean
  playlist: Playlist
  onClose: () => void
  onSaved?: (playlist: Playlist) => void
}

export default function PlaylistEditModal({ isOpen, playlist, onClose, onSaved }: PlaylistEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description ?? '')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) {
      setName(playlist.name)
      setDescription(playlist.description ?? '')
    }
  }, [isOpen, playlist.name, playlist.description])

  const hasChanges = name.trim() !== playlist.name || (description.trim() || '') !== (playlist.description ?? '')

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

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="text-xl text-white">{t('HeaderPlaylist')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent}>
      <div className="flex max-h-[90vh] flex-col">
        <div className="space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
          <TextInput label={t('LabelName')} value={name} placeholder={t('PlaceholderNewPlaylist')} onChange={setName} />
          <TextareaInput label={t('LabelDescription')} value={description} rows={4} onChange={setDescription} />
        </div>
        <div className="border-border flex justify-end gap-2 border-t px-4 py-4 sm:px-6">
          <Btn size="small" onClick={handleSave} disabled={isPending || !name.trim()}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
