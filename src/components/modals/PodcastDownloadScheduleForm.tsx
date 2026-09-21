'use client'

import { updateLibraryItemMediaAction } from '@/app/actions/mediaActions'
import ModalFooter from '@/components/modals/ModalFooter'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import TextInput from '@/components/ui/TextInput'
import Alert from '@/components/widgets/Alert'
import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isPodcastLibraryItem, type PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

function clampNonNegativeInt(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

const DEFAULT_DAILY_CRON = '0 0 * * *'

/**
 * Returns the cron expression the form should start from.
 *
 * A podcast keeps its schedule when automatic downloads are switched off, and
 * the status summary reports that stored schedule as inactive. The form has to
 * load the same value: starting from the default instead would offer to
 * overwrite the user's saved schedule the moment they re-enable fetching,
 * because an disabled podcast counts as changed as soon as the form opens.
 */
function getScheduleCronExpression(libraryItem: PodcastLibraryItem) {
  return libraryItem.media.autoDownloadSchedule || DEFAULT_DAILY_CRON
}

interface ScheduleLimitFieldProps {
  value: string
  onChange: (value: string) => void
  label: string
  helpText: string
  disabled: boolean
}

function ScheduleLimitField({ value, onChange, label, helpText, disabled }: ScheduleLimitFieldProps) {
  return (
    <div className="flex items-center gap-x-4 py-1">
      <TextInput
        value={value}
        onChange={onChange}
        type="number"
        min={0}
        disabled={disabled}
        size="small"
        customInputClass="no-spinner text-center"
        className="w-12 shrink-0"
      />
      <p className="min-w-0 flex-1 text-base leading-snug">
        {label}
        {' '}
        <HelpTooltipIcon text={helpText} />
      </p>
    </div>
  )
}

export interface PodcastDownloadScheduleFormProps {
  /** Podcast whose automatic episode download schedule is being edited. */
  libraryItem: PodcastLibraryItem
  /** Called after a successful save or disable. */
  onClose: () => void
  /** Reports save/disable progress so the manager can block dismissal. */
  onProcessingChange?: (isProcessing: boolean) => void
}

/**
 * Schedule editor for one podcast's automatic episode downloads.
 *
 * Owns the cron expression, retention limits, validation and persistence. It
 * renders no dialog chrome of its own: the grouped RSS manager supplies the
 * dialog around it.
 *
 * Saving enables automatic downloads and writes the schedule and both limits;
 * disabling clears only the enabled flag so the stored schedule survives for a
 * later re-enable. Both paths report through the shared toast and then call
 * `onClose`. A podcast without a source feed can only be disabled.
 */
export function PodcastDownloadScheduleForm({ libraryItem, onClose, onProcessingChange }: PodcastDownloadScheduleFormProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()

  const [cronExpression, setCronExpression] = useState(() => getScheduleCronExpression(libraryItem))
  const [cronIsValid, setCronIsValid] = useState(true)
  const [maxEpisodesToKeep, setMaxEpisodesToKeep] = useState('')
  const [maxNewEpisodesToDownload, setMaxNewEpisodesToDownload] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)

  const feedUrl = libraryItem.media.metadata.feedUrl ?? ''
  const savedAutoDownloadEpisodes = libraryItem.media.autoDownloadEpisodes ?? false
  const savedAutoDownloadSchedule = libraryItem.media.autoDownloadSchedule ?? ''
  const savedMaxEpisodesToKeep = libraryItem.media.maxEpisodesToKeep ?? 0
  const savedMaxNewEpisodesToDownload = libraryItem.media.maxNewEpisodesToDownload ?? 0

  const showScheduleForm = !!feedUrl
  const showDisableOnly = !feedUrl && savedAutoDownloadEpisodes

  const initForm = useCallback(() => {
    setCronExpression(getScheduleCronExpression(libraryItem))
    setCronIsValid(true)
    setMaxEpisodesToKeep(String(savedMaxEpisodesToKeep))
    setMaxNewEpisodesToDownload(String(savedMaxNewEpisodesToDownload))
  }, [libraryItem, savedMaxEpisodesToKeep, savedMaxNewEpisodesToDownload])

  // The manager mounts this panel only while its section is selected, so
  // mounting is what makes the fields current.
  useEffect(() => {
    initForm()
  }, [initForm])

  const handleCronChange = useCallback((value: string, isValid: boolean) => {
    setCronExpression(value)
    setCronIsValid(isValid)
  }, [])

  const parsedMaxEpisodesToKeep = useMemo(() => clampNonNegativeInt(maxEpisodesToKeep), [maxEpisodesToKeep])
  const parsedMaxNewEpisodesToDownload = useMemo(() => clampNonNegativeInt(maxNewEpisodesToDownload), [maxNewEpisodesToDownload])

  const resolvedSavedSchedule = savedAutoDownloadSchedule || DEFAULT_DAILY_CRON

  const isUpdated = useMemo(() => {
    if (!showScheduleForm) return false

    return (
      !savedAutoDownloadEpisodes ||
      resolvedSavedSchedule !== cronExpression ||
      savedMaxEpisodesToKeep !== parsedMaxEpisodesToKeep ||
      savedMaxNewEpisodesToDownload !== parsedMaxNewEpisodesToDownload
    )
  }, [
    cronExpression,
    parsedMaxEpisodesToKeep,
    parsedMaxNewEpisodesToDownload,
    resolvedSavedSchedule,
    savedAutoDownloadEpisodes,
    savedMaxEpisodesToKeep,
    savedMaxNewEpisodesToDownload,
    showScheduleForm
  ])

  const handleSave = useCallback(async () => {
    if (!isPodcastLibraryItem(libraryItem) || !showScheduleForm || isSaving || isDisabling || !isUpdated || !cronIsValid) return

    setIsSaving(true)
    try {
      await updateLibraryItemMediaAction(libraryItem.id, {
        autoDownloadEpisodes: true,
        autoDownloadSchedule: cronExpression,
        maxEpisodesToKeep: parsedMaxEpisodesToKeep,
        maxNewEpisodesToDownload: parsedMaxNewEpisodesToDownload
      })
      showToast(t('ToastItemDetailsUpdateSuccess'), { type: 'success' })
      onClose()
    } catch (error) {
      console.error('Failed to update podcast download schedule', error)
      showToast(t('ToastFailedToUpdate'), { type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }, [
    cronExpression,
    cronIsValid,
    isDisabling,
    isSaving,
    isUpdated,
    libraryItem,
    onClose,
    parsedMaxEpisodesToKeep,
    parsedMaxNewEpisodesToDownload,
    showScheduleForm,
    showToast,
    t
  ])

  const handleDisable = useCallback(async () => {
    if (!isPodcastLibraryItem(libraryItem) || !savedAutoDownloadEpisodes || isSaving || isDisabling) return

    setIsDisabling(true)
    try {
      await updateLibraryItemMediaAction(libraryItem.id, {
        autoDownloadEpisodes: false
      })
      showToast(t('ToastItemDetailsUpdateSuccess'), { type: 'success' })
      onClose()
    } catch (error) {
      console.error('Failed to disable podcast download schedule', error)
      showToast(t('ToastFailedToUpdate'), { type: 'error' })
    } finally {
      setIsDisabling(false)
    }
  }, [isDisabling, isSaving, libraryItem, onClose, savedAutoDownloadEpisodes, showToast, t])

  const isProcessing = isSaving || isDisabling

  useEffect(() => {
    onProcessingChange?.(isProcessing)
    // A successful save calls onClose, which unmounts this form in the same
    // commit, so the effect never runs again with false. Without clearing the
    // flag on unmount the wrapper stays stuck showing its processing overlay.
    return () => onProcessingChange?.(false)
  }, [isProcessing, onProcessingChange])

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="overflow-y-auto px-4 py-6 sm:px-6">
        {!feedUrl && (
          <Alert type="warning" className="mb-4">
            {t('ToastPodcastNoRssFeed')}
          </Alert>
        )}

        {showScheduleForm && (
          <div className="flex flex-col gap-3">
            <ScheduleLimitField
              value={maxEpisodesToKeep}
              onChange={setMaxEpisodesToKeep}
              label={t('LabelMaxEpisodesToKeep')}
              helpText={t('LabelMaxEpisodesToKeepHelp')}
              disabled={isProcessing}
            />

            <ScheduleLimitField
              value={maxNewEpisodesToDownload}
              onChange={setMaxNewEpisodesToDownload}
              label={t('LabelMaxEpisodesToDownloadPerCheck')}
              helpText={t('LabelUseZeroForUnlimited')}
              disabled={isProcessing}
            />

            <CronExpressionBuilder key={libraryItem.id} value={cronExpression} onChange={handleCronChange} />
            <CronExpressionPreview cronExpression={cronExpression} isValid={cronIsValid} />
          </div>
        )}
      </div>

      {(showScheduleForm || showDisableOnly) && (
        <ModalFooter
          destructive={
            savedAutoDownloadEpisodes
              ? {
                  label: t('ButtonDisableAutoDownloadEpisodes'),
                  onClick: handleDisable,
                  disabled: isProcessing,
                  loading: isDisabling
                }
              : undefined
          }
          primary={
            showScheduleForm
              ? {
                  label: savedAutoDownloadEpisodes ? t('ButtonSave') : t('ButtonEnable'),
                  onClick: handleSave,
                  disabled: !isUpdated || !cronIsValid || isProcessing,
                  loading: isSaving
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
