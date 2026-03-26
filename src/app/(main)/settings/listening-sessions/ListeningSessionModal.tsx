'use client'

import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDatetime, secondsToTimestamp } from '@/lib/datefns'
import { formatDuration } from '@/lib/formatDuration'
import { PlaybackSession, PlayMethod } from '@/types/api'
import { useMemo, useState } from 'react'
import { closeListeningSession, deleteListeningSession } from './actions'

interface ListeningSessionModalProps {
  isOpen: boolean
  session: PlaybackSession | null
  onClose: () => void
  onRemovedSession: () => void
  onClosedSession: () => void
}

export default function ListeningSessionModal({ isOpen, session, onClose, onRemovedSession, onClosedSession }: ListeningSessionModalProps) {
  const t = useTypeSafeTranslations()
  const { serverSettings } = useUser()
  const { showToast } = useGlobalToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)

  const currentSession = session || null
  const dateFormat = serverSettings.dateFormat
  const timeFormat = serverSettings.timeFormat

  const deviceInfo = currentSession?.deviceInfo || null

  const playMethodName = useMemo(() => {
    if (!currentSession) return t('LabelUnknown')

    if (currentSession.playMethod === PlayMethod.DIRECT_PLAY) return 'Direct Play'
    if (currentSession.playMethod === PlayMethod.TRANSCODE) return 'Transcode'
    if (currentSession.playMethod === PlayMethod.DIRECT_STREAM) return 'Direct Stream'
    if (currentSession.playMethod === PlayMethod.LOCAL) return 'Local'

    return t('LabelUnknown')
  }, [currentSession, t])

  const isOpenSession = !!currentSession?.open
  const isMediaItemShareSession = currentSession?.mediaPlayer === 'web-share'

  const clientDisplayName = useMemo(() => {
    if (!deviceInfo?.clientName) return null
    return `${deviceInfo.clientName} ${deviceInfo.clientVersion || ''}`.trim()
  }, [deviceInfo])

  const osDisplayName = useMemo(() => {
    if (!deviceInfo?.osName) return null
    return `${deviceInfo.osName} ${deviceInfo.osVersion || ''}`.trim()
  }, [deviceInfo])

  const deviceDisplayName = useMemo(() => {
    if (!deviceInfo?.manufacturer || !deviceInfo?.model) return null
    return `${deviceInfo.manufacturer} ${deviceInfo.model}`
  }, [deviceInfo])

  const sessionTitle = `${t('HeaderSession')} ${currentSession?.id || ''}`

  const handleDeleteSession = async () => {
    if (!currentSession) return

    setShowDeleteConfirmDialog(false)
    setIsProcessing(true)

    try {
      await deleteListeningSession(currentSession.id)
      showToast(t('ToastSessionDeleteSuccess'), { type: 'success' })
      onClose()
      onRemovedSession()
    } catch (error) {
      console.error('Failed to delete session', error)
      showToast(t('ToastSessionDeleteFailed'), { type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseSession = async () => {
    if (!currentSession) return

    setIsProcessing(true)

    try {
      await closeListeningSession(currentSession.id)
      onClose()
      onClosedSession()
    } catch (error) {
      console.error('Failed to close session', error)
      showToast(t('ToastSessionCloseFailed'), { type: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        processing={isProcessing}
        onClose={onClose}
        className="w-[calc(100vw-1rem)] md:max-w-[700px]"
        outerContent={
          <div className="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
            <p className="text-lg md:text-2xl text-foreground truncate">{sessionTitle}</p>
          </div>
        }
      >
        {currentSession && (
          <div className="w-full rounded-lg bg-bg overflow-y-auto overflow-x-hidden p-6" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center">
              <p className="text-base text-foreground">{currentSession.displayTitle}</p>
              {currentSession.displayAuthor && <p className="text-xs text-foreground-muted px-4">{t('LabelByAuthor', { 0: currentSession.displayAuthor })}</p>}
            </div>

            <div className="w-full h-px bg-border my-4" />

            <div className="flex flex-wrap mb-4">
              <div className="w-full md:w-2/3">
                <p className="font-semibold uppercase text-xs text-foreground-muted tracking-wide mb-2">{t('HeaderDetails')}</p>

                <DetailsRow label={t('LabelStartedAt')} value={formatJsDatetime(new Date(currentSession.startedAt), dateFormat, timeFormat)} />
                <DetailsRow label={t('LabelUpdatedAt')} value={formatJsDatetime(new Date(currentSession.updatedAt), dateFormat, timeFormat)} />
                <DetailsRow label={t('LabelTimeListened')} value={formatDuration(currentSession.timeListening, t, { showSeconds: true })} />
                <DetailsRow label={t('LabelStartTime')} value={secondsToTimestamp(currentSession.startTime)} />
                <DetailsRow label={t('LabelLastTime')} value={secondsToTimestamp(currentSession.currentTime)} />

                <p className="font-semibold uppercase text-xs text-foreground-muted tracking-wide mt-6 mb-2">{t('LabelItem')}</p>
                {currentSession.libraryId && <DetailsRow label={`${t('LabelLibrary')} Id`} value={currentSession.libraryId} valueClassName="text-xs" />}
                <DetailsRow label={`${t('LabelLibraryItem')} Id`} value={currentSession.libraryItemId} valueClassName="text-xs" />
                {currentSession.episodeId && <DetailsRow label={`${t('LabelEpisode')} Id`} value={currentSession.episodeId} valueClassName="text-xs" />}
                <DetailsRow label={t('LabelMediaType')} value={currentSession.mediaType} />
                <DetailsRow label={t('LabelDuration')} value={formatDuration(currentSession.duration, t, { showSeconds: true })} />
              </div>

              <div className="w-full md:w-1/3">
                {!isMediaItemShareSession && (
                  <>
                    <p className="font-semibold uppercase text-xs text-foreground-muted tracking-wide mb-2 mt-6 md:mt-0">{t('LabelUser')}</p>
                    <p className="mb-1 text-xs">{currentSession.user?.username || currentSession.userId || ''}</p>
                  </>
                )}

                <p className="font-semibold uppercase text-xs text-foreground-muted tracking-wide mt-6 mb-2">{t('LabelMediaPlayer')}</p>
                <p className="mb-1">{playMethodName}</p>
                <p className="mb-1">{currentSession.mediaPlayer}</p>

                {deviceInfo && (
                  <>
                    <p className="font-semibold uppercase text-xs text-foreground-muted tracking-wide mt-6 mb-2">{t('LabelDevice')}</p>
                    {clientDisplayName && <p className="mb-1">{clientDisplayName}</p>}
                    {deviceInfo.ipAddress && <p className="mb-1">{deviceInfo.ipAddress}</p>}
                    {osDisplayName && <p className="mb-1">{osDisplayName}</p>}
                    {deviceInfo.browserName && <p className="mb-1">{deviceInfo.browserName}</p>}
                    {deviceDisplayName && <p className="mb-1">{deviceDisplayName}</p>}
                    {deviceInfo.sdkVersion && (
                      <p className="mb-1">
                        SDK {t('LabelVersion')}: {deviceInfo.sdkVersion}
                      </p>
                    )}
                    {deviceInfo.deviceType && (
                      <p className="mb-1">
                        {t('LabelType')}: {deviceInfo.deviceType}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="grow" />
              {!isOpenSession && !isMediaItemShareSession && (
                <Btn size="small" color="bg-error" onClick={() => setShowDeleteConfirmDialog(true)}>
                  {t('ButtonDelete')}
                </Btn>
              )}
              {isOpenSession && !isMediaItemShareSession && (
                <Btn size="small" color="bg-error" onClick={handleCloseSession}>
                  {t('ButtonCloseSession')}
                </Btn>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        message={t('MessageConfirmDeleteSession')}
        yesButtonText={t('ButtonDelete')}
        yesButtonClassName="bg-error text-white"
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={handleDeleteSession}
      />
    </>
  )
}

function DetailsRow({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center -mx-1 mb-1">
      <div className="w-40 px-1 text-foreground-muted">{label}</div>
      <div className={`px-1 ${valueClassName}`}>{value}</div>
    </div>
  )
}
