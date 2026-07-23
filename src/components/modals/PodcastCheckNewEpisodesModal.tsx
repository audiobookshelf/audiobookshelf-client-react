'use client'

import { checkPodcastNewEpisodesAction, updateLibraryItemMediaAction } from '@/app/actions/mediaActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { timestampToDatetimeLocal } from '@/lib/datefns'
import { ApiError } from '@/lib/apiErrors'
import { isPodcastLibraryItem, type PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'

interface PodcastCheckNewEpisodesModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: PodcastLibraryItem
}

const DEFAULT_MAX_EPISODES_TO_DOWNLOAD = 3
const MAX_EPISODES_TO_DOWNLOAD_STORAGE_KEY = 'podcastCheckNewEpisodesLimit'

function getStoredMaxEpisodesToDownload(): number {
  if (typeof window === 'undefined') return DEFAULT_MAX_EPISODES_TO_DOWNLOAD
  try {
    const stored = localStorage.getItem(MAX_EPISODES_TO_DOWNLOAD_STORAGE_KEY)
    if (!stored) return DEFAULT_MAX_EPISODES_TO_DOWNLOAD
    const parsed = Number.parseInt(stored, 10)
    if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_MAX_EPISODES_TO_DOWNLOAD
    return parsed
  } catch {
    return DEFAULT_MAX_EPISODES_TO_DOWNLOAD
  }
}

function saveMaxEpisodesToDownload(limit: number) {
  try {
    localStorage.setItem(MAX_EPISODES_TO_DOWNLOAD_STORAGE_KEY, String(limit))
  } catch (error) {
    console.error('Failed to save podcast check new episodes limit', error)
  }
}

export default function PodcastCheckNewEpisodesModal({ isOpen, onClose, libraryItem }: PodcastCheckNewEpisodesModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()

  const [lastEpisodeCheckInput, setLastEpisodeCheckInput] = useState('')
  const [maxEpisodesToDownload, setMaxEpisodesToDownload] = useState(String(DEFAULT_MAX_EPISODES_TO_DOWNLOAD))
  const [isChecking, setIsChecking] = useState(false)

  const feedUrl = libraryItem.media.metadata.feedUrl ?? ''
  const savedLastEpisodeCheck = libraryItem.media.lastEpisodeCheck

  const handleMaxEpisodesChange = useCallback((value: string) => {
    setMaxEpisodesToDownload(value)
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed) && parsed >= 0) {
      saveMaxEpisodesToDownload(parsed)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setLastEpisodeCheckInput(timestampToDatetimeLocal(savedLastEpisodeCheck))
    setMaxEpisodesToDownload(String(getStoredMaxEpisodesToDownload()))
  }, [isOpen, savedLastEpisodeCheck])

  const handleSubmit = useCallback(async () => {
    if (!isPodcastLibraryItem(libraryItem) || !feedUrl || isChecking) return

    const parsedLimit = Number.parseInt(maxEpisodesToDownload, 10)
    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      setMaxEpisodesToDownload(String(DEFAULT_MAX_EPISODES_TO_DOWNLOAD))
      saveMaxEpisodesToDownload(DEFAULT_MAX_EPISODES_TO_DOWNLOAD)
      showToast(t('ToastInvalidMaxEpisodesToDownload'), { type: 'error' })
      return
    }

    const lastEpisodeCheck = new Date(lastEpisodeCheckInput).valueOf()
    if (!lastEpisodeCheck || isNaN(lastEpisodeCheck)) {
      showToast(t('ToastDateTimeInvalidOrIncomplete'), { type: 'error' })
      return
    }

    setIsChecking(true)
    try {
      if (lastEpisodeCheck !== savedLastEpisodeCheck) {
        await updateLibraryItemMediaAction(libraryItem.id, { lastEpisodeCheck })
      }

      const response = await checkPodcastNewEpisodesAction(libraryItem.id, parsedLimit)
      saveMaxEpisodesToDownload(parsedLimit)
      const newEpisodes = response?.episodes ?? []

      if (newEpisodes.length > 0) {
        showToast(t('ToastNewEpisodesFound', { 0: newEpisodes.length }), { type: 'success' })
      } else {
        showToast(t('ToastNoNewEpisodesFound'), { type: 'info' })
      }
      onClose()
    } catch (error) {
      console.error('Failed to check for new podcast episodes', error)
      const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : t('ToastFailedToUpdate')
      showToast(errorMessage, { type: 'error' })
    } finally {
      setIsChecking(false)
    }
  }, [feedUrl, isChecking, lastEpisodeCheckInput, libraryItem, maxEpisodesToDownload, onClose, savedLastEpisodeCheck, showToast, t])

  const outerContentTitle = (
    <div className="absolute start-0 top-0 p-4">
      <h2 className="text-xl text-white">{t('ButtonCheckForNewEpisodes')}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle} className="w-full md:max-w-[500px] lg:max-w-[500px]">
      <div className="flex max-h-[90vh] flex-col">
        <div className="overflow-y-auto px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4">
            <TextInput
              type="datetime-local"
              label={t('LabelLookForNewEpisodesAfterDate')}
              value={lastEpisodeCheckInput}
              onChange={setLastEpisodeCheckInput}
              disabled={isChecking}
            />

            <div className="flex items-center gap-x-4 py-1">
              <TextInput
                type="number"
                min={0}
                value={maxEpisodesToDownload}
                onChange={handleMaxEpisodesChange}
                disabled={isChecking}
                size="small"
                customInputClass="no-spinner text-center"
                className="w-12 shrink-0"
              />
              <p className="min-w-0 flex-1 text-base leading-snug">
                {t('LabelLimit')}
                {'\u00A0'}
                <HelpTooltipIcon text={t('LabelMaxEpisodesToDownload')} />
              </p>
            </div>
          </div>
        </div>

        <div className="border-border border-t px-4 py-3">
          <div className="flex justify-end">
            <Btn disabled={isChecking} loading={isChecking} onClick={handleSubmit}>
              {t('LabelDownloadEpisodes')}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
