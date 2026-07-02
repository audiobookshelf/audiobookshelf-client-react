'use client'

import TextInput from '@/components/ui/TextInput'
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { AudioFile, M4bEncodeOptions } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface EncoderOptionsCardProps {
  audioTracks: AudioFile[]
  disabled?: boolean
  onEncodingOptionsChange: (options: M4bEncodeOptions) => void
}

const CODEC_ITEMS = [
  { text: 'Copy', value: 'copy' },
  { text: 'AAC', value: 'aac' },
  { text: 'OPUS', value: 'opus' }
]

const BITRATE_ITEMS = [
  { text: '32k', value: '32k' },
  { text: '64k', value: '64k' },
  { text: '128k', value: '128k' },
  { text: '192k', value: '192k' }
]

const CHANNELS_ITEMS = [
  { text: '1 (mono)', value: 1 },
  { text: '2 (stereo)', value: 2 }
]

function buildEncodingOptions(
  showAdvancedView: boolean,
  selectedCodec: string,
  selectedBitrate: string,
  selectedChannels: number,
  customCodec: string,
  customBitrate: string,
  customChannels: string
): M4bEncodeOptions {
  if (showAdvancedView) {
    return {
      codec: customCodec || selectedCodec || 'aac',
      bitrate: customBitrate || selectedBitrate || '128k',
      channels: customChannels || selectedChannels || 2
    }
  }

  return {
    codec: selectedCodec || 'aac',
    bitrate: selectedBitrate || '128k',
    channels: selectedChannels || 2
  }
}

export default function EncoderOptionsCard({ audioTracks, disabled = false, onEncodingOptionsChange }: EncoderOptionsCardProps) {
  const t = useTypeSafeTranslations()
  const [showAdvancedView, setShowAdvancedView] = useState(false)
  const [selectedCodec, setSelectedCodec] = useState('aac')
  const [selectedBitrate, setSelectedBitrate] = useState('128k')
  const [selectedChannels, setSelectedChannels] = useState<number>(2)
  const [customCodec, setCustomCodec] = useState('aac')
  const [customBitrate, setCustomBitrate] = useState('128k')
  const [customChannels, setCustomChannels] = useState('2')
  const [currentCodec, setCurrentCodec] = useState('')
  const [currentBitrate, setCurrentBitrate] = useState('')
  const [currentChannels, setCurrentChannels] = useState<number | ''>('')
  const [currentChannelLayout, setCurrentChannelLayout] = useState('')
  const [isCodecsDifferent, setIsCodecsDifferent] = useState(false)

  const encodingOptions = useMemo(
    () => buildEncodingOptions(showAdvancedView, selectedCodec, selectedBitrate, selectedChannels, customCodec, customBitrate, customChannels),
    [customBitrate, customChannels, customCodec, selectedBitrate, selectedChannels, selectedCodec, showAdvancedView]
  )

  useEffect(() => {
    onEncodingOptionsChange(encodingOptions)
  }, [encodingOptions, onEncodingOptionsChange])

  const setPreset = useCallback((codec: string, bitrateKb: number | '', channels: number | '', codecsDifferent: boolean) => {
    if (codec === 'aac' && !codecsDifferent) {
      setSelectedCodec('copy')
    } else {
      setSelectedCodec('aac')
    }

    if (!bitrateKb) {
      setSelectedBitrate('128k')
    } else {
      const bitratesToMatch = [32, 64, 128, 192]
      const closestBitrate = bitratesToMatch.find((bitrate) => bitrate >= bitrateKb) || 192
      setSelectedBitrate(`${closestBitrate}k`)
    }

    if (!channels || Number.isNaN(channels)) {
      setSelectedChannels(2)
    } else {
      setSelectedChannels(Math.max(Math.min(Number(channels), 2), 1))
    }
  }, [])

  const setCurrentValues = useCallback(() => {
    if (audioTracks.length === 0) return

    const codec = audioTracks[0].codec
    let channels = audioTracks[0].channels
    const channelLayout = audioTracks[0].channelLayout
    let codecsDifferent = false
    let totalBitrate = 0

    for (const track of audioTracks) {
      const trackBitrate = !Number.isNaN(track.bitRate) ? track.bitRate : 0
      totalBitrate += trackBitrate

      if (track.channels > channels) channels = track.channels
      if (track.codec !== codec) {
        codecsDifferent = true
      }
    }

    setCurrentCodec(codec)
    setCurrentChannels(channels)
    setCurrentChannelLayout(channelLayout)
    setIsCodecsDifferent(codecsDifferent)
    setCurrentBitrate(String(Math.round(totalBitrate / audioTracks.length / 1000)))

    setPreset(codec, Math.round(totalBitrate / audioTracks.length / 1000), channels, codecsDifferent)
  }, [audioTracks, setPreset])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomBitrate(localStorage.getItem('embedMetadataBitrate') || '128k')
      setCustomChannels(localStorage.getItem('embedMetadataChannels') || '2')
      setCustomCodec(localStorage.getItem('embedMetadataCodec') || 'aac')
    }
    setCurrentValues()
  }, [setCurrentValues])

  const handleCustomBitrateChange = useCallback((value: string) => {
    setCustomBitrate(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('embedMetadataBitrate', value)
    }
  }, [])

  const handleCustomChannelsChange = useCallback((value: string) => {
    setCustomChannels(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('embedMetadataChannels', value)
    }
  }, [])

  const handleCustomCodecChange = useCallback((value: string) => {
    setCustomCodec(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('embedMetadataCodec', value)
    }
  }, [])

  const presetTabClass = useMemo(
    () =>
      mergeClasses(
        'flex h-8 w-1/2 items-center justify-center rounded-tl-md border border-border relative disabled:cursor-not-allowed',
        !showAdvancedView ? 'text-foreground bg-bg hover:bg-bg/60 border-b-bg' : 'text-foreground-muted hover:text-foreground bg-primary/70 hover:bg-primary/60'
      ),
    [showAdvancedView]
  )

  const advancedTabClass = useMemo(
    () =>
      mergeClasses(
        'flex h-8 w-1/2 items-center justify-center -ml-px rounded-tr-md border border-border relative disabled:cursor-not-allowed',
        showAdvancedView ? 'text-foreground bg-bg hover:bg-bg/60 border-b-bg' : 'text-foreground-muted hover:text-foreground bg-primary/70 hover:bg-primary/60'
      ),
    [showAdvancedView]
  )

  return (
    <div className="w-full py-2">
      <div className="-mb-px flex">
        <button type="button" disabled={disabled} className={presetTabClass} onClick={() => setShowAdvancedView(false)}>
          <p className="text-sm">{t('HeaderPresets')}</p>
        </button>
        <button type="button" disabled={disabled} className={advancedTabClass} onClick={() => setShowAdvancedView(true)}>
          <p className="text-sm">{t('HeaderAdvanced')}</p>
        </button>
      </div>
      <div className="border-border bg-bg mr-px rounded-b-md border p-4 md:p-8">
        {!showAdvancedView ? (
          <div className="flex flex-wrap justify-start gap-4 sm:justify-center sm:gap-8">
            <div className="flex flex-col items-start gap-2">
              <p className="w-40 text-sm font-semibold">{t('LabelCodec')}</p>
              <ToggleButtonGroup items={CODEC_ITEMS} value={selectedCodec} onChange={(value) => setSelectedCodec(String(value))} disabled={disabled} />
              <p className="text-foreground-muted text-xs">
                {t('LabelCurrently')} <span className="text-foreground">{currentCodec}</span>
                {isCodecsDifferent && <span className="text-warning"> (mixed)</span>}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <p className="w-40 text-sm font-semibold">{t('LabelBitrate')}</p>
              <ToggleButtonGroup items={BITRATE_ITEMS} value={selectedBitrate} onChange={(value) => setSelectedBitrate(String(value))} disabled={disabled} />
              <p className="text-foreground-muted text-xs">
                {t('LabelCurrently')} <span className="text-foreground">{currentBitrate} KB/s</span>
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <p className="w-40 text-sm font-semibold">{t('LabelChannels')}</p>
              <ToggleButtonGroup items={CHANNELS_ITEMS} value={selectedChannels} onChange={(value) => setSelectedChannels(Number(value))} disabled={disabled} />
              <p className="text-foreground-muted text-xs">
                {t('LabelCurrently')}{' '}
                <span className="text-foreground">
                  {currentChannels} ({currentChannelLayout})
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-wrap justify-start gap-4 sm:justify-center sm:gap-8">
              <div className="w-40">
                <TextInput label={t('LabelAudioCodec')} value={customCodec} disabled={disabled} onChange={handleCustomCodecChange} />
              </div>
              <div className="w-40">
                <TextInput label={t('LabelAudioBitrate')} value={customBitrate} disabled={disabled} onChange={handleCustomBitrateChange} />
              </div>
              <div className="w-40">
                <TextInput label={t('LabelAudioChannels')} type="number" value={customChannels} disabled={disabled} onChange={handleCustomChannelsChange} />
              </div>
            </div>
            <p className="text-warning text-xs sm:text-center sm:text-sm">{t('LabelEncodingWarningAdvancedSettings')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
