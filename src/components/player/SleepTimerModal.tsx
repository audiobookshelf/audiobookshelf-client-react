'use client'

import Modal from '@/components/modals/Modal'
import type { SleepTimerTime } from '@/hooks/useSleepTimer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { SleepTimerType } from '@/lib/player/constants'
import SleepTimerPanel from './SleepTimerPanel'

interface SleepTimerModalProps {
  isOpen: boolean
  timerSet: boolean
  timerType: SleepTimerType | null
  remaining: number
  hasChapters: boolean
  onClose: () => void
  onSet: (time: SleepTimerTime) => void
  onCancel: () => void
  onIncrement: (amount: number) => void
  onDecrement: (amount: number) => void
}

/** Legacy presentation of {@link SleepTimerPanel} — a centred modal rather than a popover. */
export default function SleepTimerModal({
  isOpen,
  timerSet,
  timerType,
  remaining,
  hasChapters,
  onClose,
  onSet,
  onCancel,
  onIncrement,
  onDecrement
}: SleepTimerModalProps) {
  const t = useTypeSafeTranslations()

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderSleepTimer')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="sm:max-w-[350px] md:max-w-[350px] lg:max-w-[350px]">
      <SleepTimerPanel
        isVisible={isOpen}
        timerSet={timerSet}
        timerType={timerType}
        remaining={remaining}
        hasChapters={hasChapters}
        onClose={onClose}
        onSet={onSet}
        onCancel={onCancel}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        className="max-h-[80vh]"
      />
    </Modal>
  )
}
