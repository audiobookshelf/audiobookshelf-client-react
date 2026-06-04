import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatSleepTimerRemaining } from '@/lib/formatDuration'
import { SleepTimerTypes, type SleepTimerType } from '@/lib/player/constants'
import type { Chapter } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface SleepTimerTime {
  seconds: number
  timerType: SleepTimerType
}

interface UseSleepTimerOptions {
  pause: () => void
  currentChapter: Chapter | null
  currentTime: number
  playbackRate: number
  onTimerEnd: () => void
}

export function useSleepTimer({ pause, currentChapter, currentTime, playbackRate, onTimerEnd }: UseSleepTimerOptions) {
  const t = useTypeSafeTranslations()
  const [sleepTimerSet, setSleepTimerSet] = useState(false)
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0)
  const [sleepTimerType, setSleepTimerType] = useState<SleepTimerType | null>(null)

  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingRef = useRef(0)
  const lastChapterIdRef = useRef<number | null>(null)

  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current)
      sleepTimerRef.current = null
    }
    setSleepTimerRemaining(0)
    setSleepTimerSet(false)
    setSleepTimerType(null)
    lastChapterIdRef.current = null
  }, [])

  const sleepTimerEnd = useCallback(() => {
    clearSleepTimer()
    pause()
    onTimerEnd()
  }, [clearSleepTimer, onTimerEnd, pause])

  const runSleepTimer = useCallback(
    (time: SleepTimerTime) => {
      remainingRef.current = time.seconds
      setSleepTimerRemaining(time.seconds)

      let lastTick = Date.now()
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current)
      }

      sleepTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - lastTick
        lastTick = Date.now()
        remainingRef.current -= elapsed / 1000

        if (remainingRef.current <= 0) {
          sleepTimerEnd()
          return
        }

        setSleepTimerRemaining(remainingRef.current)
      }, 1000)
    },
    [sleepTimerEnd]
  )

  const setSleepTimer = useCallback(
    (time: SleepTimerTime) => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current)
        sleepTimerRef.current = null
      }

      setSleepTimerSet(true)
      setSleepTimerType(time.timerType)

      if (time.timerType === SleepTimerTypes.COUNTDOWN) {
        lastChapterIdRef.current = null
        runSleepTimer(time)
      } else {
        setSleepTimerRemaining(0)
        lastChapterIdRef.current = currentChapter?.id ?? null
      }
    },
    [currentChapter, runSleepTimer]
  )

  const cancelSleepTimer = useCallback(() => {
    clearSleepTimer()
  }, [clearSleepTimer])

  const incrementSleepTimer = useCallback(
    (amount: number) => {
      if (!sleepTimerSet) return
      remainingRef.current += amount
      setSleepTimerRemaining(remainingRef.current)
    },
    [sleepTimerSet]
  )

  const decrementSleepTimer = useCallback((amount: number) => {
    if (remainingRef.current < amount) {
      remainingRef.current = 3
    } else {
      remainingRef.current = Math.max(0, remainingRef.current - amount)
    }
    setSleepTimerRemaining(remainingRef.current)
  }, [])

  const checkChapterEnd = useCallback(() => {
    if (!currentChapter) return

    if (lastChapterIdRef.current !== currentChapter.id) {
      if (lastChapterIdRef.current !== null) {
        sleepTimerEnd()
      }
      lastChapterIdRef.current = currentChapter.id
    }
  }, [currentChapter, sleepTimerEnd])

  useEffect(() => {
    if (sleepTimerType === SleepTimerTypes.CHAPTER && sleepTimerSet) {
      checkChapterEnd()
    }
  }, [checkChapterEnd, sleepTimerSet, sleepTimerType, currentChapter])

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current)
      }
    }
  }, [])

  const displayRemaining = useMemo(() => {
    if (sleepTimerType === SleepTimerTypes.CHAPTER && sleepTimerSet && currentChapter) {
      const effectivePlaybackRate = playbackRate && !Number.isNaN(playbackRate) ? playbackRate : 1
      return Math.max(0, (currentChapter.end - currentTime) / effectivePlaybackRate)
    }
    return sleepTimerRemaining
  }, [currentChapter, currentTime, playbackRate, sleepTimerRemaining, sleepTimerSet, sleepTimerType])

  const remainingString = formatSleepTimerRemaining(displayRemaining, sleepTimerType, t)

  return {
    sleepTimerSet,
    sleepTimerRemaining: displayRemaining,
    sleepTimerType,
    remainingString,
    setSleepTimer,
    cancelSleepTimer,
    incrementSleepTimer,
    decrementSleepTimer
  }
}
