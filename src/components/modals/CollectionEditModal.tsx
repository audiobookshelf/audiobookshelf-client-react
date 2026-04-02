'use client'

import { updateCollectionAction } from '@/app/actions/collectionActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Collection } from '@/types/api'
import { useCallback, useEffect, useState, useTransition } from 'react'

interface CollectionEditModalProps {
  isOpen: boolean
  collection: Collection
  onClose: () => void
  onSaved?: (collection: Collection) => void
}

export default function CollectionEditModal({ isOpen, collection, onClose, onSaved }: CollectionEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? '')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) {
      setName(collection.name)
      setDescription(collection.description ?? '')
    }
  }, [isOpen, collection.name, collection.description])

  const hasChanges = name.trim() !== collection.name || (description.trim() || '') !== (collection.description ?? '')

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
        const updated = await updateCollectionAction(collection.id, {
          name: name.trim(),
          description: description.trim() || undefined
        })
        showToast(t('ToastCollectionUpdateSuccess'), { type: 'success' })
        onSaved?.(updated)
        onClose()
      } catch (error) {
        console.error('Failed to update collection', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }, [collection.id, description, hasChanges, name, onClose, onSaved, showToast, t])

  const outerContent = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-xl text-white">{t('HeaderCollection')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent}>
      <div className="flex flex-col max-h-[90vh]">
        <div className="px-4 sm:px-6 py-6 overflow-y-auto space-y-4">
          <TextInput label={t('LabelName')} value={name} placeholder={t('PlaceholderNewCollection')} onChange={setName} />
          <TextareaInput label={t('LabelDescription')} value={description} rows={4} onChange={setDescription} />
        </div>
        <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t border-border">
          <Btn size="small" onClick={handleSave} disabled={isPending || !name.trim()}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
