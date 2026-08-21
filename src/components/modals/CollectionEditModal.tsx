'use client'

import { deleteCollectionAction, updateCollectionAction } from '@/app/actions/collectionActions'
import Modal from '@/components/modals/Modal'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import Btn from '@/components/ui/Btn'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { Collection } from '@/types/api'
import { useCallback, useEffect, useState, useTransition } from 'react'

interface CollectionEditModalProps {
  isOpen: boolean
  collection: Collection
  onClose: () => void
  onSaved?: (collection: Collection) => void
  /** Called after the collection is deleted successfully (e.g. navigate away from the detail page). */
  onDeleted?: () => void
}

export default function CollectionEditModal({ isOpen, collection, onClose, onSaved, onDeleted }: CollectionEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { userCanDelete } = useUser()
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? '')
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(collection.name)
      setDescription(collection.description ?? '')
      setConfirmOpen(false)
    }
  }, [isOpen, collection.name, collection.description])

  const hasChanges = name.trim() !== collection.name || (description.trim() || '') !== (collection.description ?? '')
  const coverWidth = 100
  const coverHeight = 50

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

  const handleRemove = useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const handleRemoveConfirm = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteCollectionAction(collection.id)
        showToast(t('ToastCollectionRemoveSuccess'), { type: 'success' })
        setConfirmOpen(false)
        onClose()
        onDeleted?.()
      } catch (error) {
        console.error('Failed to delete collection', error)
        showToast(t('ToastRemoveFailed'), { type: 'error' })
      }
    })
  }, [collection.id, onClose, onDeleted, showToast, t])

  const outerContent = <ModalOuterContent>{t('HeaderCollection')}</ModalOuterContent>

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent}>
        <div className="flex max-h-[90vh] flex-col">
          <div className="space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex justify-center sm:justify-start">
                <CollectionGroupCover books={collection.books ?? []} width={coverWidth} height={coverHeight} />
              </div>
              <div className="flex-1 space-y-4">
                <TextInput label={t('LabelName')} value={name} placeholder={t('PlaceholderNewCollection')} onChange={setName} trimWhitespace />
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
        message={t('MessageConfirmRemoveCollection', { 0: collection.name })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error"
        processing={isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRemoveConfirm}
      />
    </>
  )
}
