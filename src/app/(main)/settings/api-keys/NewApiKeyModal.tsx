'use client'

import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface NewApiKeyModalProps {
  isOpen: boolean
  apiKeyName: string
  apiKeyValue: string
  onClose: () => void
}

export default function NewApiKeyModal({ isOpen, apiKeyName, apiKeyValue, onClose }: NewApiKeyModalProps) {
  const t = useTypeSafeTranslations()

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={<ModalOuterContent>{t('HeaderNewApiKey')}</ModalOuterContent>}>
      <div className="flex flex-col">
        <div className="px-6 py-8">
          <h2 className="text-foreground mb-4 text-xl">{t('LabelApiKeyCreated', { 0: apiKeyName })}</h2>
          <p className="text-foreground-muted mb-6">{t('LabelApiKeyCreatedDescription')}</p>
          <TextInput value={apiKeyValue} readOnly showCopy />
        </div>
        <ModalFooter primary={{ label: t('ButtonClose'), onClick: onClose }} />
      </div>
    </Modal>
  )
}
