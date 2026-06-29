'use client'

import { bytesPretty } from '@/lib/string'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { AudioTrack } from '@/types/api'

interface AudioTracksProgressTableProps {
  tracks: AudioTrack[]
  audioFilesEncoding: Record<string, string>
  audioFilesFinished: Record<string, boolean>
}

export default function AudioTracksProgressTable({ tracks, audioFilesEncoding, audioFilesFinished }: AudioTracksProgressTableProps) {
  const t = useTypeSafeTranslations()

  return (
    <div>
      <p className="mb-2 font-semibold">{t('HeaderAudioTracks')}</p>
      <div className="border-border bg-bg w-full border">
        <div className="bg-primary/25 flex px-4 py-2">
          <div className="text-foreground-muted w-10 text-xs font-semibold">#</div>
          <div className="text-foreground-muted grow text-xs font-semibold uppercase">{t('LabelFilename')}</div>
          <div className="text-foreground-muted hidden w-20 text-xs font-semibold uppercase lg:block">{t('LabelChannels')}</div>
          <div className="text-foreground-muted hidden w-16 text-xs font-semibold uppercase md:block">{t('LabelCodec')}</div>
          <div className="text-foreground-muted hidden w-16 text-xs font-semibold uppercase md:block">{t('LabelBitrate')}</div>
          <div className="text-foreground-muted w-16 text-xs font-semibold uppercase">{t('LabelSize')}</div>
          <div className="w-24" />
        </div>
        {tracks.map((file) => (
          <div key={file.ino} className={`flex px-4 py-2 text-xs sm:text-sm ${file.index % 2 === 0 ? 'bg-primary/25' : ''}`}>
            <div className="w-10 min-w-10">{file.index}</div>
            <div className="grow break-all">{file.metadata.filename}</div>
            <div className="text-foreground-muted hidden w-20 min-w-20 lg:block">
              {file.channels || 'unknown'} ({file.channelLayout || 'unknown'})
            </div>
            <div className="text-foreground-muted hidden w-16 min-w-16 md:block">{file.codec || 'unknown'}</div>
            <div className="text-foreground-muted hidden w-16 min-w-16 md:block">{bytesPretty(file.bitRate || 0, 0)}</div>
            <div className="text-foreground-muted w-16 min-w-16">{bytesPretty(file.metadata.size)}</div>
            <div className="w-24 min-w-24">
              <div className="flex justify-center">
                {audioFilesFinished[file.ino] ? (
                  <span className="material-symbols text-success text-xl leading-none">check_circle</span>
                ) : audioFilesEncoding[file.ino] ? (
                  <span className="text-success font-mono leading-none">{audioFilesEncoding[file.ino]}</span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
