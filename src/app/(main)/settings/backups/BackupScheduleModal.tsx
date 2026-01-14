import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
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

  const outerContentTitle = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-xl text-foreground">{t('HeaderSetBackupSchedule')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle} className="w-full md:max-w-[700px] lg:max-w-[700px]">
      <div className="p-6">
        <CronExpressionBuilder value={cronExpressionValue} onChange={setCronExpressionValue} />
        <CronExpressionPreview cronExpression={cronExpressionValue} />

        {/* Footer */}
        <div className="pt-3 flex justify-end">
          <Btn onClick={handleSave} disabled={!hasChanges} loading={isPending}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
