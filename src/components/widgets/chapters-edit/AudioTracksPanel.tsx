'use client'

import Btn from '@/components/ui/Btn'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import type { AudioTrack } from '@/types/api'

interface AudioTracksPanelProps {
  tracks: AudioTrack[]
  currentTrackIndex: number
  isPlayingChapter: boolean
  onSetChaptersFromTracks: () => void
}

export default function AudioTracksPanel({ tracks, currentTrackIndex, isPlayingChapter, onSetChaptersFromTracks }: AudioTracksPanelProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="w-full max-w-3xl overflow-x-hidden px-2 py-4 xl:max-w-xl">
      <div className="mb-4 flex items-center gap-1 py-1">
        <p className="text-lg font-semibold">{t('HeaderAudioTracks')}</p>
        <div className="grow" />
        <Btn size="small" onClick={onSetChaptersFromTracks}>
          {t('ButtonSetChaptersFromTracks')}
        </Btn>
        <HelpTooltipIcon text={t('MessageSetChaptersFromTracksDescription')} />
      </div>

      <div className="text-foreground-muted mb-2 flex text-xs font-semibold uppercase">
        <div className="min-w-0 grow xl:max-w-sm">{t('LabelFilename')}</div>
        <div className="w-20">{t('LabelDuration')}</div>
        <div className="hidden w-20 text-center md:block">{t('HeaderChapters')}</div>
      </div>

      {tracks.map((track) => (
        <div key={track.ino} className={mergeClasses('flex items-center py-2', currentTrackIndex === track.index && isPlayingChapter && 'bg-success/10')}>
          <div className="min-w-0 grow overflow-hidden pr-2 xl:max-w-sm">
            <TruncatingTooltipText lazy text={track.metadata.filename} className="text-xs" maxWidth={400} />
          </div>
          <div className="w-20" style={{ minWidth: 80 }}>
            <p className="text-foreground-muted font-mono text-xs">{secondsToTimestamp(Math.round(track.duration))}</p>
          </div>
          <div className="hidden w-20 justify-center md:flex" style={{ minWidth: 80 }}>
            {(track.chapters || []).length > 0 && <span className="material-symbols text-success text-sm">check</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
