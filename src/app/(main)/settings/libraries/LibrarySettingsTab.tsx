'use client'

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LibrarySettings } from '@/types/api'
import SettingsToggleSwitch from '../SettingsToggleSwitch'

type MarkAsFinishedMode = 'time-remaining' | 'percent-complete'

interface LibrarySettingsTabProps {
  settings: LibrarySettings
  mediaType: 'book' | 'podcast'
  onSettingsChange: (updater: (prev: LibrarySettings) => LibrarySettings) => void
}

export default function LibrarySettingsTab({ settings, mediaType, onSettingsChange }: LibrarySettingsTabProps) {
  const t = useTypeSafeTranslations()

  const handleSettingChanged = <K extends keyof LibrarySettings>(key: K, value: LibrarySettings[K]) => {
    onSettingsChange((prev) => ({ ...prev, [key]: value }))
  }

  const markAsFinishedMode: MarkAsFinishedMode =
    settings.markAsFinishedPercentComplete != null && settings.markAsFinishedPercentComplete > 0 ? 'percent-complete' : 'time-remaining'

  const markAsFinishedValue =
    markAsFinishedMode === 'percent-complete' ? (settings.markAsFinishedPercentComplete ?? 95) : (settings.markAsFinishedTimeRemaining ?? 30)

  const markAsFinishedItems: DropdownItem[] = [
    { text: t('LabelSettingsLibraryMarkAsFinishedTimeRemaining'), value: 'time-remaining' },
    { text: t('LabelSettingsLibraryMarkAsFinishedPercentComplete'), value: 'percent-complete' }
  ]

  const handleMarkAsFinishedModeChange = (value: string | number) => {
    const mode = value as MarkAsFinishedMode
    if (mode === 'time-remaining') {
      onSettingsChange((prev) => ({
        ...prev,
        markAsFinishedTimeRemaining: prev.markAsFinishedTimeRemaining ?? 30,
        markAsFinishedPercentComplete: null
      }))
    } else {
      onSettingsChange((prev) => ({
        ...prev,
        markAsFinishedPercentComplete: prev.markAsFinishedPercentComplete ?? 95,
        markAsFinishedTimeRemaining: null
      }))
    }
  }

  const handleMarkAsFinishedValueChange = (inputValue: string) => {
    const numValue = Number(inputValue)
    if (isNaN(numValue) || numValue < 0) return
    if (markAsFinishedMode === 'time-remaining') {
      handleSettingChanged('markAsFinishedTimeRemaining', numValue)
    } else {
      handleSettingChanged('markAsFinishedPercentComplete', numValue)
    }
  }

  const isBookLibrary = mediaType === 'book'

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
      {/* Left column */}
      <div className="flex flex-col gap-2">
        <SettingsToggleSwitch
          label={t('LabelSettingsSquareBookCovers')}
          value={settings.coverAspectRatio === 1}
          onChange={(value) => handleSettingChanged('coverAspectRatio', value ? 1 : 0)}
          tooltip={t('LabelSettingsSquareBookCoversHelp')}
        />
        {isBookLibrary && (
          <SettingsToggleSwitch
            label={t('LabelSettingsAudiobooksOnly')}
            value={!!settings.audiobooksOnly}
            onChange={(value) => handleSettingChanged('audiobooksOnly', value)}
            tooltip={t('LabelSettingsAudiobooksOnlyHelp')}
          />
        )}
        {isBookLibrary && (
          <SettingsToggleSwitch
            label={t('LabelSettingsSkipMatchingBooksWithISBN')}
            value={!!settings.skipMatchingMediaWithIsbn}
            onChange={(value) => handleSettingChanged('skipMatchingMediaWithIsbn', value)}
          />
        )}
        {isBookLibrary && (
          <SettingsToggleSwitch
            label={t('LabelSettingsOnlyShowLaterBooksInContinueSeries')}
            value={!!settings.onlyShowLaterBooksInContinueSeries}
            onChange={(value) => handleSettingChanged('onlyShowLaterBooksInContinueSeries', value)}
            tooltip={t('LabelSettingsOnlyShowLaterBooksInContinueSeriesHelp')}
          />
        )}
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-2">
        <SettingsToggleSwitch
          label={t('LabelSettingsEnableWatcherForLibrary')}
          value={!settings.disableWatcher}
          onChange={(value) => handleSettingChanged('disableWatcher', !value)}
        />
        {isBookLibrary && (
          <SettingsToggleSwitch
            label={t('LabelSettingsSkipMatchingBooksWithASIN')}
            value={!!settings.skipMatchingMediaWithAsin}
            onChange={(value) => handleSettingChanged('skipMatchingMediaWithAsin', value)}
          />
        )}
        {isBookLibrary && (
          <SettingsToggleSwitch
            label={t('LabelSettingsHideSingleBookSeries')}
            value={!!settings.hideSingleBookSeries}
            onChange={(value) => handleSettingChanged('hideSingleBookSeries', value)}
            tooltip={t('LabelSettingsHideSingleBookSeriesHelp')}
          />
        )}
        {isBookLibrary && (
          <SettingsToggleSwitch
            label={t('LabelSettingsEpubsAllowScriptedContent')}
            value={!!settings.epubsAllowScriptedContent}
            onChange={(value) => handleSettingChanged('epubsAllowScriptedContent', value)}
            tooltip={t('LabelSettingsEpubsAllowScriptedContentHelp')}
          />
        )}
      </div>

      {/* TODO: Podcast search region */}

      {/* Mark media item as finished when */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Dropdown
          label={t('LabelSettingsLibraryMarkAsFinishedWhen')}
          items={markAsFinishedItems}
          value={markAsFinishedMode}
          onChange={handleMarkAsFinishedModeChange}
          className="min-w-xs"
        />
        <div className="relative">
          <TextInput
            type="number"
            value={markAsFinishedValue}
            min="0"
            onChange={handleMarkAsFinishedValueChange}
            className="w-20"
            customInputClass="no-spinner"
          />
          {markAsFinishedMode === 'percent-complete' && (
            <span className="text-foreground-muted absolute end-0 top-0 flex h-full items-center justify-center px-2 text-sm" aria-hidden="true">
              %
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
