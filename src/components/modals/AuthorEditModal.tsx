'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Author, User } from '@/types/api'
import { useEffect, useMemo, useState } from 'react'
import AuthorImage from '../covers/AuthorImage'
import IconBtn from '../ui/IconBtn'
import TextInput from '../ui/TextInput'
import TextareaInput from '../ui/TextareaInput'
import ConfirmDialog from '../widgets/ConfirmDialog'

interface AuthorEditModalProps {
  isOpen: boolean
  user: User
  author?: Author | null
  isProcessing: boolean
  onClose: () => void
  onSave: (editedAuthor: Partial<Author>) => void
  onDelete: (editedAuthor: Partial<Author>) => void
  onQuickMatch: (editedAuthor: Partial<Author>) => void
  onSubmitImage: (url: string) => void
  onRemoveImage: () => void
}

export default function AuthorEditModal({
  isOpen,
  user,
  author,
  isProcessing,
  onClose,
  onSave,
  onDelete,
  onQuickMatch,
  onSubmitImage,
  onRemoveImage
}: AuthorEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [editedAuthor, setEditedAuthor] = useState<Partial<Author> | null>(null)
  const [imgUrl, setImgUrl] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const saveDisabled = useMemo(() => {
    return !!(editedAuthor?.name === author?.name && editedAuthor?.asin === author?.asin && editedAuthor?.description === author?.description)
  }, [editedAuthor, author])

  // Initialize editedAuthor when author changes
  useEffect(() => {
    if (author) {
      setEditedAuthor({
        name: author.name,
        asin: author.asin,
        description: author.description
      })
      setShowConfirmDialog(false)
    }
  }, [author])

  if (!author || !editedAuthor) return

  const handleOnDelete = () => {
    setShowConfirmDialog(true)
  }

  const handleSave = () => {
    if (editedAuthor?.name === author?.name && editedAuthor.asin === author?.asin && editedAuthor?.description === author?.description) {
      showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
      return
    }
    onSave(editedAuthor)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setImgUrl('')
          onClose()
        }}
        processing={isProcessing}
      >
        <div className="h-full max-h-[85vh] overflow-y-auto px-2 sm:px-4 py-6">
          <div className="h-full w-full flex flex-col sm:flex-row">
            <div className="w-full sm:w-40 p-2 flex justify-center sm:block">
              <div className="w-32 sm:w-full h-40 sm:h-45 relative">
                <AuthorImage author={author}></AuthorImage>
                {author.imagePath && (
                  <div className="absolute top-0 right-0 w-full h-full opacity-0 hover:opacity-100">
                    <IconBtn
                      borderless={true}
                      className="absolute top-0 right-0 text-error cursor-pointer transform hover:scale-125 hover:not-disabled:text-error transition-transform"
                      onClick={onRemoveImage}
                    >
                      delete
                    </IconBtn>
                  </div>
                )}
              </div>
            </div>
            {/* form */}
            <div className="grow mb-2 px-2 pt-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <TextInput className="w-full" placeholder={t('LabelImageURLFromTheWeb')} value={imgUrl} onChange={setImgUrl}></TextInput>
                <Btn
                  color="bg-success"
                  className="sm:ml-2 flex-shrink-0"
                  onClick={() => {
                    if (!imgUrl?.startsWith('http:') && !imgUrl?.startsWith('https:')) {
                      showToast(t('ToastInvalidImageUrl'), { type: 'error' })
                      return
                    }
                    onSubmitImage(imgUrl)
                    setImgUrl('')
                  }}
                >
                  {t('ButtonSubmit')}
                </Btn>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 pt-4">
                <div className="w-full sm:w-3/4">
                  <label htmlFor="" className="text-sm mb-1 px-1">
                    {t('LabelName')}
                  </label>
                  <TextInput
                    className="sm:pe-2"
                    placeholder={t('LabelName')}
                    value={editedAuthor.name || ''}
                    onChange={(value) => setEditedAuthor({ ...editedAuthor, name: value })}
                  />
                </div>
                <div className="w-full sm:w-1/4">
                  <label htmlFor="" className="text-sm mb-1 px-1">
                    ASIN
                  </label>
                  <TextInput placeholder="ASIN" value={editedAuthor.asin || ''} onChange={(value) => setEditedAuthor({ ...editedAuthor, asin: value })} />
                </div>
              </div>
              <div className="flex grow pt-4">
                <div className="w-full">
                  <label htmlFor="" className="text-sm mb-1 px-1">
                    {t('LabelDescription')}
                  </label>
                  <TextareaInput
                    rows={8}
                    value={editedAuthor.description || ''}
                    onChange={(value) => setEditedAuthor({ ...editedAuthor, description: value })}
                  />
                </div>
              </div>
              {/* Buttons */}
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pt-6">
                {user.permissions.delete && (
                  <Btn color="bg-error" className="flex-1 sm:flex-none" onClick={handleOnDelete}>
                    {t('ButtonRemove')}
                  </Btn>
                )}
                <div className="hidden sm:block grow" />
                <Btn className="flex-2 sm:flex-none" onClick={() => onQuickMatch(editedAuthor)}>
                  {t('ButtonQuickMatch')}
                </Btn>
                <Btn color="bg-success" className="w-full sm:w-auto" disabled={saveDisabled} onClick={() => handleSave()}>
                  {t('ButtonSave')}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={t('MessageConfirmRemoveAuthor', { 0: editedAuthor.name || '' })}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => onDelete(editedAuthor)}
      />
    </>
  )
}
