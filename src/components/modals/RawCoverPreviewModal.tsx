'use client'

import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import Image from 'next/image'

interface RawCoverPreviewModalProps {
  isOpen: boolean
  coverUrl: string | null
  onClose: () => void
}

export default function RawCoverPreviewModal({ isOpen, coverUrl, onClose }: RawCoverPreviewModalProps) {
  const t = useTypeSafeTranslations()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!w-[90dvw] !h-[90dvh] !max-w-none !mt-0 !bg-transparent !shadow-none !border-none !p-0"
      bgOpacityClass="bg-black/90"
    >
      <div className="w-full h-full flex items-center justify-center relative" onClick={onClose}>
        {coverUrl && <Image src={coverUrl} alt={t('LabelCoverPreview')} fill className="object-scale-down" unoptimized />}
      </div>
    </Modal>
  )
}
