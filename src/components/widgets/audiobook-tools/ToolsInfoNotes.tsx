'use client'

import type { ReactNode } from 'react'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { AudiobookTool } from '@/hooks/useAudiobookTools'

interface ToolsInfoNotesProps {
  selectedTool: AudiobookTool
  libraryItemRelPath: string
  libraryItemId: string
  shouldBackupAudioFiles: boolean
  trackCount: number
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-start">
      <span className="material-symbols text-warning pt-1 text-base">star</span>
      <p className="text-foreground-muted ms-2">{children}</p>
    </div>
  )
}

export default function ToolsInfoNotes({ selectedTool, libraryItemRelPath, libraryItemId, shouldBackupAudioFiles, trackCount }: ToolsInfoNotesProps) {
  const t = useTypeSafeTranslations()
  const isEmbedTool = selectedTool === 'embed'
  const isM4BTool = selectedTool === 'm4b'

  return (
    <div className="mb-4">
      {isEmbedTool ? (
        <InfoNote>{t('LabelEncodingInfoEmbedded')}</InfoNote>
      ) : (
        <InfoNote>
          {t('LabelEncodingFinishedM4B')} <span className="rounded-md bg-neutral-600 px-1 py-0.5 font-mono text-sm text-white">.../{libraryItemRelPath}/</span>.
        </InfoNote>
      )}

      {(shouldBackupAudioFiles || isM4BTool) && (
        <InfoNote>
          {t('LabelEncodingBackupLocation')}{' '}
          <span className="rounded-md bg-neutral-600 px-1 py-0.5 font-mono text-sm text-white">/metadata/cache/items/{libraryItemId}/</span>.{' '}
          {t('LabelEncodingClearItemCache')}
        </InfoNote>
      )}

      {isEmbedTool && trackCount > 1 && <InfoNote>{t('LabelEncodingChaptersNotEmbedded')}</InfoNote>}

      {isM4BTool && (
        <>
          <InfoNote>{t('LabelEncodingTimeWarning')}</InfoNote>
          <InfoNote>{t('LabelEncodingWatcherDisabled')}</InfoNote>
        </>
      )}

      <InfoNote>{t('LabelEncodingStartedNavigation')}</InfoNote>
    </div>
  )
}
