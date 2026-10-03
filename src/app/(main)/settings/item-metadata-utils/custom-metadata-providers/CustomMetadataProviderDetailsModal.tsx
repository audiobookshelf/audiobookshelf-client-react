'use client'

import Modal from '@/components/modals/Modal'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { CustomMetadataProvider } from '@/types/api'

interface CustomMetadataProviderDetailsModalProps {
  provider: CustomMetadataProvider | null
  onClose: () => void
}

export default function CustomMetadataProviderDetailsModal({ provider, onClose }: CustomMetadataProviderDetailsModalProps) {
  const t = useTypeSafeTranslations()

  if (!provider) return null

  return (
    <Modal isOpen onClose={onClose} outerContent={<ModalOuterContent>{t('HeaderDetails')}</ModalOuterContent>}>
      <div className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <TextInput label={t('LabelName')} value={provider.name} readOnly />
        <TextInput
          label="URL" // i18n-ignore
          value={provider.url}
          readOnly
        />
        <TextInput
          label={t('LabelProviderAuthorizationValue')}
          value={provider.authHeaderValue || ''}
          type={provider.authHeaderValue ? 'password' : 'text'}
          readOnly
        />
      </div>
    </Modal>
  )
}
