'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import type { SleepTimerTime } from '@/hooks/useSleepTimer'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { SleepTimerTypes, type SleepTimerType } from '@/lib/player/constants'
import type { TypeSafeTranslations } from '@/types/translations'
import { useMemo, useState } from 'react'

/** Max HH:MM:SS shown in the sleep timer modal (keeps layout stable when time is adjusted up). */
const SLEEP_TIMER_DISPLAY_MAX_SECONDS = 99 * 3600 + 59 * 60 + 59

function formatSleepTimerCountdown(seconds: number): string {
  return secondsToTimestamp(Math.min(Math.max(0, seconds), SLEEP_TIMER_DISPLAY_MAX_SECONDS))
}

interface SleepTimerPreset {
  seconds: number
  text: string
  shortLabel: string
  timerType: SleepTimerType
}

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

function getPresetShortLabel(seconds: number, timerType: SleepTimerType, t: TypeSafeTranslations): string {
  if (timerType === SleepTimerTypes.CHAPTER) {
    return 'EoC'
  }

  if (seconds >= 3600) {
    return t('LabelDurationCompactHours', { count: seconds / 3600 })
  }

  return t('LabelDurationCompactMinutes', { count: seconds / 60 })
}

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
  const [customTime, setCustomTime] = useState('')

  const thirtyMinutesLabel = useMemo(() => t('LabelDurationCompactMinutes', { count: 30 }), [t])
  const fiveMinutesLabel = useMemo(() => t('LabelDurationCompactMinutes', { count: 5 }), [t])

  const sleepTimes = useMemo((): SleepTimerPreset[] => {
    const times: SleepTimerPreset[] = [
      {
        seconds: 60 * 5,
        text: t('LabelTimeDurationXMinutes', { 0: 5 }),
        shortLabel: getPresetShortLabel(60 * 5, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 15,
        text: t('LabelTimeDurationXMinutes', { 0: 15 }),
        shortLabel: getPresetShortLabel(60 * 15, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 20,
        text: t('LabelTimeDurationXMinutes', { 0: 20 }),
        shortLabel: getPresetShortLabel(60 * 20, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 30,
        text: t('LabelTimeDurationXMinutes', { 0: 30 }),
        shortLabel: getPresetShortLabel(60 * 30, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 45,
        text: t('LabelTimeDurationXMinutes', { 0: 45 }),
        shortLabel: getPresetShortLabel(60 * 45, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 60,
        text: t('LabelTimeDurationXMinutes', { 0: 60 }),
        shortLabel: getPresetShortLabel(60 * 60, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 90,
        text: t('LabelTimeDurationXMinutes', { 0: 90 }),
        shortLabel: getPresetShortLabel(60 * 90, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      },
      {
        seconds: 60 * 120,
        text: t('LabelTimeDurationXHours', { 0: 2 }),
        shortLabel: getPresetShortLabel(60 * 120, SleepTimerTypes.COUNTDOWN, t),
        timerType: SleepTimerTypes.COUNTDOWN
      }
    ]

    if (hasChapters) {
      times.push({
        seconds: -1,
        text: t('LabelEndOfChapter'),
        shortLabel: getPresetShortLabel(-1, SleepTimerTypes.CHAPTER, t),
        timerType: SleepTimerTypes.CHAPTER
      })
    }

    return times
  }, [hasChapters, t])

  const handleSetTime = (time: SleepTimerPreset) => {
    onSet({ seconds: time.seconds, timerType: time.timerType })
    if (!timerSet) {
      onClose()
    }
  }

  const submitCustomTime = (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = Number(customTime)
    if (!customTime || Number.isNaN(parsed) || parsed <= 0) {
      setCustomTime('')
      return
    }

    const timeInSeconds = Math.round(parsed * 60)
    onSet({ seconds: timeInSeconds, timerType: SleepTimerTypes.COUNTDOWN })
    setCustomTime('')
    onClose()
  }

  const handleDecrement = (amount: number) => {
    let adjustedAmount = amount
    if (amount > remaining) {
      if (remaining > 60) adjustedAmount = 60
      else adjustedAmount = 5
    }
    onDecrement(adjustedAmount)
  }

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderSleepTimer')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="sm:max-w-[350px] md:max-w-[350px] lg:max-w-[350px]">
      <div className="max-h-[80vh] w-full overflow-y-auto px-1 py-0.5">
        {timerSet ? (
          <>
            <section className="flex flex-col items-center p-4 pb-0">
              {timerType === SleepTimerTypes.COUNTDOWN ? (
                <>
                  <div className="mt-4 flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Btn
                        size="small"
                        disabled={remaining < 30 * 60}
                        className="px-2"
                        ariaLabel={`${t('ButtonJumpBackward')}, ${thirtyMinutesLabel}`}
                        onClick={() => handleDecrement(30 * 60)}
                      >
                        <span className="material-symbols text-lg">remove</span>
                        <span className="ps-1 text-sm">{thirtyMinutesLabel}</span>
                      </Btn>

                      <IconBtn
                        className="min-w-9"
                        size="small"
                        ariaLabel={`${t('ButtonJumpBackward')}, ${fiveMinutesLabel}`}
                        onClick={() => handleDecrement(60 * 5)}
                      >
                        remove
                      </IconBtn>
                    </div>

                    <p className="font-mono text-xl">{formatSleepTimerCountdown(remaining)}</p>

                    <div className="flex items-center gap-2">
                      <IconBtn
                        className="min-w-9"
                        size="small"
                        ariaLabel={`${t('ButtonJumpForward')}, ${fiveMinutesLabel}`}
                        onClick={() => onIncrement(60 * 5)}
                      >
                        add
                      </IconBtn>

                      <Btn size="small" className="px-2" ariaLabel={`${t('ButtonJumpForward')}, ${thirtyMinutesLabel}`} onClick={() => onIncrement(30 * 60)}>
                        <span className="material-symbols text-lg">add</span>
                        <span className="ps-1 text-sm">{thirtyMinutesLabel}</span>
                      </Btn>
                    </div>
                  </div>
                </>
              ) : (
                <p className="font-mono text-2xl">{formatSleepTimerCountdown(remaining)}</p>
              )}

              <Btn className="mt-2 w-full" onClick={onCancel}>
                {t('ButtonCancel')}
              </Btn>
            </section>

            <div className="border-border mx-4 h-px" />

            <div className="flex flex-wrap justify-center gap-2 p-4">
              {sleepTimes
                .filter((time) => time.timerType === SleepTimerTypes.COUNTDOWN)
                .map((time) => (
                  <Btn key={time.seconds} size="small" className="min-w-12 shrink-0 px-3" onClick={() => handleSetTime(time)}>
                    {time.shortLabel}
                  </Btn>
                ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1 px-3 py-2">
              {sleepTimes.map((time) => (
                <Btn key={time.text} className="flex w-full justify-center text-lg" onClick={() => handleSetTime(time)} ariaLabel={time.text}>
                  {time.text}
                </Btn>
              ))}
            </div>

            <form className="flex items-center justify-center gap-2 px-4 py-3" onSubmit={submitCustomTime}>
              <TextInput
                value={customTime}
                type="number"
                step="any"
                min={0.1}
                placeholder={t('LabelTimeInMinutes')}
                onChange={setCustomTime}
                className="w-48"
              />
              <Btn type="submit" className="px-4">
                {t('ButtonSubmit')}
              </Btn>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
