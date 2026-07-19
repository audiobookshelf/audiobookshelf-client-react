'use client'

import { updateLibraryItemMediaAction } from '@/app/actions/mediaActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import TextInput from '@/components/ui/TextInput'
import Alert from '@/components/widgets/Alert'
import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isPodcastLibraryItem, type PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface PodcastDownloadScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: PodcastLibraryItem
}

function clampNonNegativeInt(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

const DEFAULT_DAILY_CRON = '0 0 * * *'

function getScheduleCronExpression(libraryItem: PodcastLibraryItem) {
  const savedSchedule = libraryItem.media.autoDownloadSchedule
  const isEnabled = libraryItem.media.autoDownloadEpisodes ?? false
  if (isEnabled && savedSchedule) return savedSchedule
  return DEFAULT_DAILY_CRON
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
        {'\u00A0'}
        <HelpTooltipIcon text={helpText} />
      </p>
    </div>
  )
}

export default function PodcastDownloadScheduleModal({ isOpen, onClose, libraryItem }: PodcastDownloadScheduleModalProps) {
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

  useEffect(() => {
    if (!isOpen) return
    initForm()
  }, [initForm, isOpen])

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

  const outerContentTitle = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="text-xl text-white">{t('HeaderScheduleEpisodeDownloads')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={isProcessing} outerContent={outerContentTitle} className="w-full md:max-w-[700px] lg:max-w-[700px]">
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

              <CronExpressionBuilder key={`${libraryItem.id}-${isOpen}`} value={cronExpression} onChange={handleCronChange} />
              <CronExpressionPreview cronExpression={cronExpression} isValid={cronIsValid} />
            </div>
          )}
        </div>

        {(showScheduleForm || showDisableOnly) && (
          <div className="border-border border-t px-4 py-3">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {savedAutoDownloadEpisodes && (
                <Btn color="bg-error" disabled={isProcessing} loading={isDisabling} onClick={handleDisable} className="sm:me-auto">
                  {t('ButtonDisableAutoDownloadEpisodes')}
                </Btn>
              )}
              {showScheduleForm && (
                <Btn disabled={!isUpdated || !cronIsValid || isProcessing} loading={isSaving} onClick={handleSave}>
                  {savedAutoDownloadEpisodes ? t('ButtonSave') : t('ButtonEnable')}
                </Btn>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
