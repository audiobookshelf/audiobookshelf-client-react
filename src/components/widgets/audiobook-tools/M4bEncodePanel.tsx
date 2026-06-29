'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import EncoderOptionsCard from '@/components/widgets/audiobook-tools/EncoderOptionsCard'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { AudioTrack, M4bEncodeOptions } from '@/types/api'

interface M4bEncodePanelProps {
  tracks: AudioTrack[]
  processing: boolean
  progress: string
  isTaskFinished: boolean
  taskFailed: boolean
  taskError: string | null
  isCancelingEncode: boolean
  encodeTaskHasEncodingOptions: boolean
  encodingOptions: M4bEncodeOptions
  onEncodingOptionsChange: (options: M4bEncodeOptions) => void
  onStartEncode: () => void
  onCancelEncode: () => void
}

export default function M4bEncodePanel({
  tracks,
  processing,
  progress,
  isTaskFinished,
  taskFailed,
  taskError,
  isCancelingEncode,
  encodeTaskHasEncodingOptions,
  encodingOptions,
  onEncodingOptionsChange,
  onStartEncode,
  onCancelEncode
}: M4bEncodePanelProps) {
  const t = useTypeSafeTranslations()

  return (
    <>
      <div className="mb-4 flex w-full items-center">
        <div className="grow" />

        {!isTaskFinished && processing && (
          <Btn color="bg-error" loading={isCancelingEncode} className="me-2" onClick={onCancelEncode}>
            {t('ButtonCancelEncode')}
          </Btn>
        )}

        {!isTaskFinished ? (
          <Btn color="bg-primary" loading={processing} progress={progress} onClick={onStartEncode}>
            {t('ButtonStartM4BEncode')}
          </Btn>
        ) : taskFailed ? (
          <p className="text-error text-lg font-semibold">
            {t('MessageM4BFailed')} {taskError}
          </p>
        ) : (
          <p className="text-success text-lg font-semibold">{t('MessageM4BFinished')}</p>
        )}
      </div>

      {encodeTaskHasEncodingOptions ? (
        <div className="border-border mb-4 border-b pb-4">
          <div className="-mx-2 flex flex-wrap">
            <TextInput label={t('LabelAudioBitrate')} value={encodingOptions.bitrate} readOnly className="m-2 max-w-40" />
            <TextInput label={t('LabelAudioChannels')} value={String(encodingOptions.channels)} readOnly className="m-2 max-w-40" />
            <TextInput label={t('LabelAudioCodec')} value={encodingOptions.codec} readOnly className="m-2 max-w-40" />
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <EncoderOptionsCard
            audioTracks={tracks}
            disabled={processing || isTaskFinished}
            onEncodingOptionsChange={onEncodingOptionsChange}
          />
        </div>
      )}
    </>
  )
}
