import { useSocketEvent } from '@/contexts/SocketContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useAuthorActions } from '@/hooks/useAuthorActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Author, User } from '@/types/api'
import { useEffect, useMemo, useState, useTransition } from 'react'
import AuthorImage from '../covers/AuthorImage'
import Modal from '../modals/Modal'
import Btn from '../ui/Btn'
import IconBtn from '../ui/IconBtn'
import SlateEditor from '../ui/SlateEditor'
import TextInput from '../ui/TextInput'
import ConfirmDialog from '../widgets/ConfirmDialog'

interface AuthorEditModalProps {
  isOpen: boolean
  user: User
  author?: Author | null
  onClose: () => void
}

export default function AuthorEditModal({ isOpen, user, author: authorProp, onClose }: AuthorEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()

  const [author, setAuthor] = useState<Author | null>(authorProp || null)
  const [editedAuthor, setEditedAuthor] = useState<Partial<Author> | null>(null)
  const [imgUrl, setImgUrl] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { handleQuickMatch, handleSave, handleDelete, handleSubmitImage, handleRemoveImage } = useAuthorActions()

  const isDirty = useMemo(() => {
    if (!editedAuthor || !author) return false
    return (
      editedAuthor.name !== author.name || (editedAuthor.asin || '') !== (author.asin || '') || (editedAuthor.description || '') !== (author.description || '')
    )
  }, [editedAuthor, author])

  const saveDisabled = !isDirty

  const updateAuthorState = (author: Author) => {
    setAuthor(author)
    setEditedAuthor({
      name: author.name,
      asin: author.asin,
      description: author.description
    })
  }
  // Update author state when author prop changes
  useEffect(() => {
    if (authorProp) {
      updateAuthorState(authorProp)
      setShowConfirmDialog(false)
    }
  }, [authorProp])

  useSocketEvent<Author>('author_updated', (updatedAuthor) => {
    if (author && updatedAuthor.id === author.id) {
      updateAuthorState(updatedAuthor)
    }
  })

  if (!author || !editedAuthor) return

  const handleOnDelete = () => {
    setShowConfirmDialog(true)
  }

  const handleSaveClick = () => {
    if (!isDirty) {
      showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
      return
    }
    startTransition(async () => {
      const success = await handleSave(author.id, author.name || '', editedAuthor)
      if (success) onClose()
    })
  }

  const handleQuickMatchWrapper = () => {
    startTransition(async () => {
      await handleQuickMatch(author, editedAuthor)
    })
  }

  const handleSubmitImageWrapper = (url: string) => {
    startTransition(async () => {
      await handleSubmitImage(author.id, url)
    })
  }

  const handleRemoveImageWrapper = () => {
    startTransition(async () => {
      await handleRemoveImage(author.id)
    })
  }

  const handleDeleteWrapper = () => {
    startTransition(async () => {
      const success = await handleDelete(author.id)
      if (success) onClose()
    })
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setImgUrl('')
          onClose()
        }}
        processing={isPending}
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="overflow-y-auto px-4 py-6 sm:px-6">
            <div className="flex h-full w-full flex-col sm:flex-row">
              <div className="flex w-full shrink-0 justify-center p-2 sm:block sm:w-40">
                <div className="relative h-40 w-32 sm:h-45 sm:w-full">
                  <AuthorImage author={author}></AuthorImage>
                  {author.imagePath && (
                    <div className="absolute top-0 right-0 h-full w-full opacity-0 focus-within:opacity-100 hover:opacity-100">
                      <IconBtn
                        borderless={true}
                        className="text-error hover:not-disabled:text-error absolute top-0 right-0 transform cursor-pointer transition-transform hover:scale-125"
                        onClick={handleRemoveImageWrapper}
                      >
                        delete
                      </IconBtn>
                    </div>
                  )}
                </div>
              </div>
              {/* form */}
              <div className="mb-2 grow px-2 pt-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                  <TextInput className="w-full" placeholder={t('LabelImageURLFromTheWeb')} value={imgUrl} onChange={setImgUrl}></TextInput>
                  <Btn
                    color="bg-success"
                    className="flex-shrink-0 sm:ml-2"
                    onClick={() => {
                      if (!imgUrl?.startsWith('http:') && !imgUrl?.startsWith('https:')) {
                        showToast(t('ToastInvalidImageUrl'), { type: 'error' })
                        return
                      }
                      handleSubmitImageWrapper(imgUrl)
                      setImgUrl('')
                    }}
                  >
                    {t('ButtonSubmit')}
                  </Btn>
                </div>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:gap-0">
                  <div className="w-full sm:w-3/4">
                    <label htmlFor="" className="mb-1 px-1 text-sm">
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
                    <label htmlFor="" className="mb-1 px-1 text-sm">
                      ASIN
                    </label>
                    <TextInput placeholder="ASIN" value={editedAuthor.asin || ''} onChange={(value) => setEditedAuthor({ ...editedAuthor, asin: value })} />
                  </div>
                </div>
                <div className="flex grow pt-4">
                  <div className="w-full">
                    <SlateEditor
                      key={author.id}
                      srcContent={author.description || ''}
                      onUpdate={(value: string) => setEditedAuthor((prev) => ({ ...prev!, description: value }))}
                      label={t('LabelDescription')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border border-t px-4 py-3">
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
              {user.permissions.delete && (
                <Btn color="bg-error" className="mr-auto" onClick={handleOnDelete}>
                  {t('ButtonRemove')}
                </Btn>
              )}
              <Btn onClick={handleQuickMatchWrapper}>{t('ButtonQuickMatch')}</Btn>
              <Btn disabled={saveDisabled} onClick={handleSaveClick}>
                {t('ButtonSave')}
              </Btn>
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
        onConfirm={handleDeleteWrapper}
      />
    </>
  )
}
