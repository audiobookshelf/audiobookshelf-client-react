import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime } from '@/lib/datefns'
import { Backup } from '@/types/api'

interface RestoreBackupModalProps {
  isOpen: boolean
  backup: Backup | null
  dateFormat: string
  timeFormat: string
  onClose: () => void
  onConfirmRestore: () => void
}

export default function RestoreBackupModal({ isOpen, backup, dateFormat, timeFormat, onClose, onConfirmRestore }: RestoreBackupModalProps) {
  const t = useTypeSafeTranslations()

  if (!backup) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[675px] md:max-w-[675px]"
      outerContent={<ModalOuterContent>{t('ButtonRestore')}</ModalOuterContent>}
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="overflow-y-auto px-4 py-6 sm:px-6">
          <p className="text-error text-lg font-semibold">{t('MessageImportantNotice')}</p>
          <div className="text-foreground py-1 text-base">{t.rich('MessageRestoreBackupWarning', { br: () => <br /> })}</div>
          <p className="text-foreground my-8 text-center text-lg">
            {t('MessageRestoreBackupConfirmWithDate', { 0: formatJsDatetime(new Date(backup.createdAt), dateFormat, timeFormat) })}
          </p>
        </div>
        <ModalFooter
          secondary={{ label: t('ButtonNevermind'), onClick: onClose }}
          primary={{ label: t('ButtonRestore'), onClick: onConfirmRestore }}
        />
      </div>
    </Modal>
  )
}
