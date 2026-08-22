import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useEffect, useState } from 'react'

interface BackupScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  isPending: boolean
  cronExpression: string
  onUpdate: (cronExpression: string) => void
}

export default function BackupScheduleModal({ isOpen, onClose, isPending, cronExpression, onUpdate }: BackupScheduleModalProps) {
  const t = useTypeSafeTranslations()
  const [cronExpressionValue, setCronExpressionValue] = useState(cronExpression)

  useEffect(() => {
    if (isOpen) {
      setCronExpressionValue(cronExpression)
    }
  }, [isOpen, cronExpression])

  const handleSave = () => {
    if (!hasChanges || isPending) return
    onUpdate(cronExpressionValue)
  }

  const hasChanges = cronExpressionValue !== cronExpression

  const outerContentTitle = <ModalOuterContent>{t('HeaderSetBackupSchedule')}</ModalOuterContent>

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle} className="w-full md:max-w-[700px] lg:max-w-[700px]">
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex flex-col gap-2 overflow-y-auto px-4 py-6 sm:px-6">
          <CronExpressionBuilder value={cronExpressionValue} onChange={setCronExpressionValue} />
          <CronExpressionPreview cronExpression={cronExpressionValue} />
        </div>

        <ModalFooter
          primary={{
            label: t('ButtonSave'),
            onClick: handleSave,
            disabled: !hasChanges,
            loading: isPending
          }}
        />
      </div>
    </Modal>
  )
}
