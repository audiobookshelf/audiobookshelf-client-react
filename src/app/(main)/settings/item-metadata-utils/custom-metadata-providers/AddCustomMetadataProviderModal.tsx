'use client'

import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { CreateCustomMetadataProviderPayload } from '@/types/api'
import { useState } from 'react'

interface AddCustomMetadataProviderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateCustomMetadataProviderPayload) => Promise<void>
}

export default function AddCustomMetadataProviderModal({ isOpen, onClose, onSubmit }: AddCustomMetadataProviderModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [authHeaderValue, setAuthHeaderValue] = useState('')
  const [processing, setProcessing] = useState(false)

  const reset = () => {
    setName('')
    setUrl('')
    setAuthHeaderValue('')
    setProcessing(false)
  }

  const handleClose = () => {
    if (processing) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName || !trimmedUrl) {
      showToast(t('ToastProviderNameAndUrlRequired'), { type: 'error' })
      return
    }

    try {
      setProcessing(true)
      await onSubmit({
        name: trimmedName,
        url: trimmedUrl,
        mediaType: 'book',
        authHeaderValue: authHeaderValue.trim() || undefined
      })
      showToast(t('ToastProviderCreatedSuccess'), { type: 'success' })
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('ToastUnknownError')
      console.error('Failed to add provider', error)
      showToast(t('ToastProviderCreatedFailedWithError', { 0: errorMessage }), { type: 'error' })
      setProcessing(false)
    }
  }

  const outerContentTitle = <ModalOuterContent>{t('HeaderAddCustomMetadataProvider')}</ModalOuterContent>

  return (
    <Modal isOpen={isOpen} processing={processing} onClose={handleClose} outerContent={outerContentTitle} className="w-[700px]">
      <div className="flex max-h-[90vh] flex-col">
        <div className="overflow-y-auto px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
            <div className="md:col-span-3">
              <TextInput label={t('LabelName')} value={name} placeholder={t('LabelName')} onChange={setName} />
            </div>
            <div className="md:col-span-1">
              <TextInput label={t('LabelMediaType')} value="Book" readOnly />
            </div>
          </div>

          <div className="mt-4">
            <TextInput
              label="URL" // i18n-ignore
              value={url}
              placeholder="URL" // i18n-ignore
              onChange={setUrl}
            />
          </div>

          <div className="mt-4">
            <TextInput
              label={t('LabelProviderAuthorizationValue')}
              value={authHeaderValue}
              placeholder={t('LabelProviderAuthorizationValue')}
              type="password"
              onChange={setAuthHeaderValue}
            />
          </div>
        </div>

        <ModalFooter
          primary={{
            label: t('ButtonAdd'),
            onClick: handleSubmit,
            disabled: processing
          }}
        />
      </div>
    </Modal>
  )
}
