'use client'

import { getAudioFileFFProbeDataAction } from '@/app/actions/audioFileActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import TextareaInput from '@/components/ui/TextareaInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { copyToClipboard } from '@/lib/clipboard'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { bytesPretty } from '@/lib/string'
import { AudioFile, FFProbeData } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import IconBtn from '../ui/IconBtn'

interface AudioFileDataModalProps {
  isOpen: boolean
  audioFile: AudioFile | null
  libraryItemId: string
  onClose: () => void
}

/**
 * Modal to display audio file metadata and optional FFProbe data
 *
 * Shows detailed information about an audio file including:
 * - Basic metadata (path, size, duration, format, codec, etc.)
 * - Meta tags from the file
 * - Optional FFProbe raw data (for admins)
 */
export default function AudioFileDataModal({ isOpen, audioFile, libraryItemId, onClose }: AudioFileDataModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [ffprobeData, setFfprobeData] = useState<FFProbeData | null>(null)
  const [hasCopied, setHasCopied] = useState(false)
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFfprobeData(null)
      setHasCopied(false)
      // Focus first interactive element when modal opens
      setTimeout(() => {
        const firstButton = document.querySelector('[cy-id="modal-content"] button') as HTMLButtonElement
        if (firstButton) {
          firstButton.focus()
        }
      }, 100)
    }
  }, [isOpen])

  const metadata = useMemo(() => audioFile?.metadata, [audioFile])
  const metaTags = useMemo(() => audioFile?.metaTags || {}, [audioFile])

  const prettyFfprobeData = useMemo(() => {
    if (!ffprobeData) return ''
    return JSON.stringify(ffprobeData, null, 2)
  }, [ffprobeData])

  const handleGetFFProbeData = useCallback(() => {
    if (!audioFile) return

    startTransition(async () => {
      try {
        const data = await getAudioFileFFProbeDataAction(libraryItemId, audioFile.ino)
        console.log('Got ffprobe data', data)
        setFfprobeData(data)
      } catch (error) {
        console.error('Failed to get ffprobe data', error)
        showToast(t('ToastFailedToLoadData'), { type: 'error' })
      }
    })
  }, [audioFile, libraryItemId, startTransition, showToast, t])

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await copyToClipboard(prettyFfprobeData)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
      showToast(t('ButtonCopiedToClipboard'), { type: 'success' })
    } catch (error) {
      console.error('Failed to copy to clipboard', error)
      showToast(t('ToastFailedToShare'), { type: 'error' })
    }
  }, [prettyFfprobeData, showToast, t])

  const handleCopyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleCopyToClipboard()
      }
    },
    [handleCopyToClipboard]
  )

  const handleReset = useCallback(() => {
    setFfprobeData(null)
  }, [])

  if (!audioFile) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className={mergeClasses('w-full rounded-lg bg-bg overflow-x-hidden p-4 sm:p-6', ffprobeData ? 'overflow-hidden flex flex-col' : 'overflow-y-auto')}
        style={ffprobeData ? { height: '80vh' } : { maxHeight: '80vh' }}
      >
        <div className={mergeClasses('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0', ffprobeData && 'shrink-0')}>
          <h2 className="text-base text-foreground-muted truncate" title={metadata?.filename}>
            {metadata?.filename}
          </h2>
          {ffprobeData ? (
            <Btn size="small" className="sm:ml-2 shrink-0" onClick={handleReset}>
              {t('ButtonReset')}
            </Btn>
          ) : (
            <Btn size="small" loading={isPending} className="sm:ml-2 shrink-0" onClick={handleGetFFProbeData}>
              {t('ButtonProbeAudioFile')}
            </Btn>
          )}
        </div>

        <div className={mergeClasses('w-full h-px bg-border my-4', ffprobeData && 'shrink-0')} />

        {!ffprobeData ? (
          <>
            <TextInput value={metadata?.path || ''} readOnly label={t('LabelPath')} className="mb-4 text-sm" />

            <dl className="flex flex-col sm:flex-row text-sm gap-4">
              <div className="w-full sm:w-1/2">
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelSize')}</dt>
                  <dd className="break-words">{bytesPretty(metadata?.size || 0)}</dd>
                </div>
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelDuration')}</dt>
                  <dd className="break-words">{secondsToTimestamp(audioFile.duration)}</dd>
                </div>
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelFormat')}</dt>
                  <dd className="break-words">{audioFile.codec}</dd>
                </div>
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('HeaderChapters')}</dt>
                  <dd className="break-words">{audioFile.chapters?.length || 0}</dd>
                </div>
                {audioFile.embeddedCoverArt && (
                  <div className="flex flex-row mb-1 gap-0">
                    <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelEmbeddedCover')}</dt>
                    <dd className="break-words">{audioFile.embeddedCoverArt}</dd>
                  </div>
                )}
              </div>
              <div className="w-full sm:w-1/2">
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelCodec')}</dt>
                  <dd className="break-words">{audioFile.codec}</dd>
                </div>
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelChannels')}</dt>
                  <dd className="break-words">
                    {audioFile.channels} ({audioFile.channelLayout})
                  </dd>
                </div>
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelBitrate')}</dt>
                  <dd className="break-words">{bytesPretty(audioFile.bitRate || 0, 0)}</dd>
                </div>
                <div className="flex flex-row mb-1 gap-0">
                  <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelTimeBase')}</dt>
                  <dd className="break-words">{audioFile.timeBase}</dd>
                </div>
                {audioFile.language && (
                  <div className="flex flex-row mb-1 gap-0">
                    <dt className="w-32 min-w-24 text-gray-400 shrink-0">{t('LabelLanguage')}</dt>
                    <dd className="break-words">{audioFile.language}</dd>
                  </div>
                )}
              </div>
            </dl>

            <div className="w-full h-px bg-white/10 my-4" role="separator" aria-orientation="horizontal" />

            <h3 className="font-bold mb-2">{t('LabelMetaTags')}</h3>

            {Object.entries(metaTags).length > 0 ? (
              <dl className="text-sm">
                {Object.entries(metaTags).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row mb-1 gap-1 sm:gap-2">
                    <dt className="w-32 min-w-24 sm:min-w-32 text-gray-400 shrink-0 sm:break-words">{key.replace('tag', '')}</dt>
                    <dd className="break-words flex-1 min-w-0">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-400" role="status">
                {t('MessageNoItems')}
              </p>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-h-0 relative">
              <TextareaInput
                value={prettyFfprobeData}
                readOnly
                fillHeight
                className={mergeClasses('text-xs font-mono flex flex-col flex-1 min-h-0')}
                label={t('LabelMetaTags')}
              />
              <IconBtn
                ref={copyButtonRef}
                borderless
                className={mergeClasses('absolute top-7 right-4', 'p-2 rounded z-10', hasCopied ? 'text-success' : 'text-gray-400 hover:text-white')}
                onClick={handleCopyToClipboard}
                onKeyDown={handleCopyKeyDown}
                ariaLabel={t('ButtonCopyToClipboard')}
                aria-live="polite"
              >
                <span aria-hidden="true">{hasCopied ? 'done' : 'content_copy'}</span>
                {hasCopied && <span className="sr-only">{t('ButtonCopiedToClipboard')}</span>}
              </IconBtn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
