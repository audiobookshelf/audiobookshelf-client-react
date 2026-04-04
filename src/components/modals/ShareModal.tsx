'use client'

import { closeMediaItemShareAction, openMediaItemShareAction } from '@/app/actions/shareActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import TextInput from '@/components/ui/TextInput'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import Tooltip from '@/components/ui/Tooltip'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiError } from '@/lib/api'
import { formatDuration } from '@/lib/formatDuration'
import type { MediaItemShare } from '@/types/api'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ShareDurationUnit = 'minutes' | 'hours' | 'days'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItemId?: string
  mediaItemShare: MediaItemShare | null
  onShareChange?: (share: MediaItemShare | null) => void
}

function getRandomSlug(length = 10) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return result
}

function toUnixMs(value: number | string | null | undefined): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

export default function ShareModal({ isOpen, onClose, mediaItemId, mediaItemShare, onShareChange }: ShareModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const locale = useLocale()

  const [processing, setProcessing] = useState(false)
  const [newShareSlug, setNewShareSlug] = useState('')
  const [newShareDuration, setNewShareDuration] = useState(0)
  const [shareDurationUnit, setShareDurationUnit] = useState<ShareDurationUnit>('minutes')
  const [isDownloadable, setIsDownloadable] = useState(false)
  const [currentShare, setCurrentShare] = useState<MediaItemShare | null>(null)

  const handleDurationChange = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setNewShareDuration(0)
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      setNewShareDuration(0)
      return
    }
    setNewShareDuration(parsed)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setNewShareSlug(getRandomSlug(10))
    setNewShareDuration(0)
    setShareDurationUnit('minutes')
    setIsDownloadable(false)
    setCurrentShare(mediaItemShare ? { ...mediaItemShare } : null)
  }, [isOpen, mediaItemShare])

  const durationUnits = useMemo(
    () => [
      { text: t('LabelMinutes'), value: 'minutes' },
      { text: t('LabelHours'), value: 'hours' },
      { text: t('LabelDays'), value: 'days' }
    ],
    [t]
  )

  const expireDurationSeconds = useMemo(() => {
    const duration = Number(newShareDuration)
    if (!duration || Number.isNaN(duration) || duration < 0) return 0
    if (shareDurationUnit === 'hours') return duration * 3600
    if (shareDurationUnit === 'days') return duration * 86400
    return duration * 60
  }, [newShareDuration, shareDurationUnit])

  const demoShareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/share/${newShareSlug}`
  }, [newShareSlug])

  const currentShareUrl = useMemo(() => {
    if (!currentShare || typeof window === 'undefined') return ''
    return `${window.location.origin}/share/${currentShare.slug}`
  }, [currentShare])

  const currentShareTimeRemaining = useMemo(() => {
    if (!currentShare) return t('LabelPermanent')
    const expiresAtMs = toUnixMs(currentShare.expiresAt)
    if (!expiresAtMs) return t('LabelPermanent')
    const remainingMs = expiresAtMs - Date.now()
    if (remainingMs <= 0) return 'Expired'
    return formatDuration(remainingMs / 1000, t, { showDays: true })
  }, [currentShare, t])

  const expirationDateString = useMemo(() => {
    if (!expireDurationSeconds) return t('LabelPermanent')
    const date = new Date(Date.now() + expireDurationSeconds * 1000)
    return date.toLocaleString(locale)
  }, [expireDurationSeconds, locale, t])

  const handleDeleteShare = useCallback(async () => {
    if (!currentShare) return
    setProcessing(true)
    try {
      await closeMediaItemShareAction(currentShare.id)
      setCurrentShare(null)
      onShareChange?.(null)
    } catch (error) {
      console.error('deleteShare', error)
      showToast('Failed to delete share', { type: 'error' })
    } finally {
      setProcessing(false)
    }
  }, [currentShare, onShareChange, showToast])

  const handleOpenShare = useCallback(async () => {
    if (!mediaItemId) {
      showToast(t('ToastFailedToUpdate'), { type: 'error' })
      return
    }
    const slug = newShareSlug.trim()
    if (!slug) {
      showToast(t('ToastSlugRequired'), { type: 'error' })
      return
    }

    setProcessing(true)
    try {
      const share = await openMediaItemShareAction({
        slug,
        mediaItemType: 'book',
        mediaItemId,
        expiresAt: expireDurationSeconds ? Date.now() + expireDurationSeconds * 1000 : 0,
        isDownloadable
      })
      setCurrentShare(share)
      onShareChange?.(share)
    } catch (error) {
      console.error('openShare', error)
      showToast((error as ApiError).message || 'Failed to share item', { type: 'error' })
    } finally {
      setProcessing(false)
    }
  }, [expireDurationSeconds, isDownloadable, mediaItemId, newShareSlug, onShareChange, showToast, t])

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="max-w-[calc(100vw-4rem)] truncate text-xl font-semibold text-white">{t('LabelShare')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} processing={processing} className="sm:max-w-[520px] md:max-w-[560px] lg:max-w-[560px]">
      <div className="max-h-[80vh] overflow-x-hidden overflow-y-auto px-4 py-6 text-sm sm:px-6">
        <div className="absolute end-0 top-0 p-4">
          <Tooltip text={t('LabelClickForMoreInfo')} className="inline-flex">
            <a
              href="https://www.audiobookshelf.org/guides/media-item-shares"
              target="_blank"
              rel="noreferrer"
              className="text-foreground-muted hover:text-foreground inline-flex"
            >
              <span className="material-symbols text-xl">help_outline</span>
            </a>
          </Tooltip>
        </div>

        {currentShare ? (
          <>
            <div className="w-full py-2">
              <label className="block px-1 text-sm font-semibold">{t('LabelShareURL')}</label>
              <TextInput value={currentShareUrl} showCopy readOnly />
            </div>
            <div className="w-full space-y-1 px-1 py-2">
              {currentShare.isDownloadable && <p className="text-sm">{t('LabelDownloadable')}</p>}
              {currentShare.expiresAt ? <p>{t('MessageShareExpiresIn', { 0: currentShareTimeRemaining })}</p> : <p>{t('LabelPermanent')}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 grid grid-cols-1 gap-y-3 sm:grid-cols-[12rem_auto] sm:items-end sm:gap-x-4">
              <div className="w-full sm:w-48">
                <label className="block px-1 text-sm font-semibold">{t('LabelSlug')}</label>
                <TextInput value={newShareSlug} onChange={setNewShareSlug} className="h-10 text-base" />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block px-1 text-sm font-semibold">{t('LabelDuration')}</label>
                <div className="inline-flex items-center gap-2">
                  <TextInput
                    value={newShareDuration}
                    onChange={handleDurationChange}
                    type="number"
                    step={1}
                    min={0}
                    className="h-10 max-w-20 min-w-20 text-center text-base sm:max-w-16 sm:min-w-16"
                    customInputClass="text-center"
                  />
                  <div className="w-28">
                    <Dropdown value={shareDurationUnit} items={durationUnits} onChange={(value) => setShareDurationUnit(value as ShareDurationUnit)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 flex w-full items-center md:w-1/2">
              <p className="text-foreground-muted px-1 py-1 text-sm">{t('LabelDownloadable')}</p>
              <ToggleSwitch size="medium" value={isDownloadable} onChange={setIsDownloadable} />
              <Tooltip text={t('LabelShareDownloadableHelp')} position="right" maxWidth={160} openOnClick addTabIndex>
                <span className="text-foreground-muted inline-flex h-8 w-8 cursor-pointer items-center justify-center sm:h-auto sm:w-auto">
                  <span className="material-symbols icon-text text-lg">info</span>
                </span>
              </Tooltip>
            </div>

            <p className="text-foreground-muted px-1 py-1 text-sm">
              {t.rich('MessageShareURLWillBe', {
                0: demoShareUrl,
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </p>
            <p className="text-foreground-muted px-1 py-1 text-sm">
              {t.rich('MessageShareExpirationWillBe', {
                0: expirationDateString,
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </p>
          </>
        )}

        <div className="flex items-center pt-6">
          <div className="grow" />
          {currentShare ? (
            <Btn color="bg-error" size="small" onClick={handleDeleteShare} disabled={processing}>
              {t('ButtonDelete')}
            </Btn>
          ) : (
            <Btn color="bg-success" size="small" onClick={handleOpenShare} disabled={processing}>
              {t('ButtonShare')}
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  )
}
