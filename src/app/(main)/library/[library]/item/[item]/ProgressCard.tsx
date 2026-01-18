'use client'

import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { elapsedPretty } from '@/lib/timeUtils'
import { MediaProgress } from '@/types/api'
import { useLocale } from 'next-intl'
import { useCallback, useMemo, useState, useTransition } from 'react'

// Simple date formatting helper
const formatProgressDate = (timestamp: number, locale: string): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

interface ProgressCardProps {
  /** User's media progress for this item */
  progress: MediaProgress | null
  /** Total duration of the media in seconds */
  duration: number
  /** Whether the item has ebook progress */
  hasEbookProgress?: boolean
  /** Callback to reset progress */
  onResetProgress?: () => Promise<void>
  /** Date format from server settings */
  dateFormat?: string
  /** Additional class names */
  className?: string
}

/**
 * Displays user progress for a library item with actions to reset or mark as finished.
 *
 * Features:
 * - Progress percentage with visual bar
 * - Started/Finished dates
 * - Time remaining calculation
 * - Reset progress action with confirmation
 */
export default function ProgressCard({ progress, duration, hasEbookProgress = false, onResetProgress, className = '' }: ProgressCardProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()

  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [isPendingReset, startResetTransition] = useTransition()

  // Calculate progress values
  const progressPercent = useMemo(() => {
    if (!progress) return 0
    if (hasEbookProgress && progress.ebookProgress && progress.ebookProgress > 0) {
      return Math.max(Math.min(1, progress.ebookProgress), 0)
    }
    return Math.max(Math.min(1, progress.progress || 0), 0)
  }, [progress, hasEbookProgress])

  const isFinished = progress?.isFinished || false
  const startedAt = progress?.startedAt || 0
  const finishedAt = progress?.finishedAt || 0

  const timeRemaining = useMemo(() => {
    if (!progress || isFinished) return 0
    const progressDuration = progress.duration || duration
    return progressDuration - (progress.currentTime || 0)
  }, [progress, duration, isFinished])

  // Callbacks must be defined before early return (React hooks rules)
  const handleResetClick = useCallback(() => {
    setShowConfirmReset(true)
  }, [])

  const handleConfirmReset = useCallback(() => {
    setShowConfirmReset(false)
    startResetTransition(async () => {
      await onResetProgress?.()
    })
  }, [onResetProgress])

  // Don't show if no progress
  if (!progress || progressPercent === 0) {
    return null
  }

  return (
    <div
      className={`px-4 py-2 bg-primary text-sm font-semibold rounded-md text-gray-100 relative max-w-max ${isPendingReset ? 'opacity-50' : ''} ${className}`}
    >
      {/* Progress text */}
      {progressPercent < 1 ? (
        <>
          <p className="leading-6">
            {t('LabelYourProgress')}: {Math.round(progressPercent * 100)}%
          </p>
          {!hasEbookProgress && timeRemaining > 0 && (
            <p className="text-gray-200 text-xs" suppressHydrationWarning>
              {t('LabelTimeRemaining', { time: elapsedPretty(timeRemaining, locale) })}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs">
          {t('LabelFinished')} {formatProgressDate(finishedAt, locale)}
        </p>
      )}

      {/* Started date */}
      {startedAt > 0 && (
        <p className="text-gray-400 text-xs pt-1">
          {t('LabelStarted')} {formatProgressDate(startedAt, locale)}
        </p>
      )}

      {/* Reset button */}
      {!isPendingReset && onResetProgress && (
        <button
          type="button"
          className="absolute -top-1.5 -right-1.5 p-1 w-5 h-5 rounded-full bg-bg hover:bg-error border border-primary flex items-center justify-center cursor-pointer transition-colors"
          onClick={handleResetClick}
          aria-label={t('ButtonCancel')}
        >
          <span className="material-symbols text-sm">close</span>
        </button>
      )}

      {/* Confirm reset dialog */}
      <ConfirmDialog
        isOpen={showConfirmReset}
        message={t('MessageConfirmResetProgress')}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  )
}
