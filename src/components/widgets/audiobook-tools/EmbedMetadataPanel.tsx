'use client'

import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Alert from '@/components/widgets/Alert'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface EmbedMetadataPanelProps {
  isMetadataEmbedQueued: boolean
  queuedEmbedCount: number
  processing: boolean
  progress: string
  isTaskFinished: boolean
  taskFailed: boolean
  taskError: string | null
  shouldBackupAudioFiles: boolean
  onBackupChange: (value: boolean) => void
  onStartEmbed: () => void
}

export default function EmbedMetadataPanel({
  isMetadataEmbedQueued,
  queuedEmbedCount,
  processing,
  progress,
  isTaskFinished,
  taskFailed,
  taskError,
  shouldBackupAudioFiles,
  onBackupChange,
  onStartEmbed
}: EmbedMetadataPanelProps) {
  const t = useTypeSafeTranslations()

  if (isMetadataEmbedQueued) {
    return (
      <Alert type="warning" className="mb-4">
        <p className="text-lg">{t('MessageEmbedQueue', { 0: queuedEmbedCount })}</p>
      </Alert>
    )
  }

  return (
    <div className="mb-4 flex w-full items-center justify-end">
      {!isTaskFinished && (
        <Checkbox
          value={shouldBackupAudioFiles}
          disabled={processing}
          label={t('LabelBackupAudioFiles')}
          checkboxBgClass="bg-bg"
          labelClass="ps-2 text-base md:text-lg"
          onChange={onBackupChange}
        />
      )}

      <div className="grow" />

      {!isTaskFinished ? (
        <Btn color="bg-primary" loading={processing} progress={progress} onClick={onStartEmbed}>
          {t('ButtonStartMetadataEmbed')}
        </Btn>
      ) : taskFailed ? (
        <p className="text-error text-lg font-semibold">
          {t('MessageEmbedFailed')} {taskError}
        </p>
      ) : (
        <p className="text-success text-lg font-semibold">{t('MessageEmbedFinished')}</p>
      )}
    </div>
  )
}
