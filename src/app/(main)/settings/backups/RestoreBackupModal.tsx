import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
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
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[675px] md:max-w-[675px]">
      <div className="max-h-[90vh] overflow-y-auto px-4 py-6 sm:px-6">
        <p className="text-error text-lg font-semibold">{t('MessageImportantNotice')}</p>
        <div className="text-foreground py-1 text-base">{t.rich('MessageRestoreBackupWarning', { br: () => <br /> })}</div>
        <p className="text-foreground my-8 text-center text-lg">
          {t('MessageRestoreBackupConfirm')} {formatJsDatetime(new Date(backup.createdAt), dateFormat, timeFormat)}?
        </p>
        <div className="flex items-center">
          <Btn color="bg-primary" onClick={onClose}>
            {t('ButtonNevermind')}
          </Btn>
          <div className="grow" />
          <Btn color="bg-success" onClick={onConfirmRestore}>
            {t('ButtonRestore')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
