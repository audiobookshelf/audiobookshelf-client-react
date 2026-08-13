'use client'

import Modal from '@/components/modals/Modal'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import type { PlayerSettings } from '@/hooks/usePlayerSettings'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface PlayerSettingsModalProps {
  isOpen: boolean
  settings: PlayerSettings
  onClose: () => void
  onUpdateSettings: (updates: Partial<PlayerSettings>) => void
}

// Playback rate increment/decrement values
const PLAYBACK_RATE_INCREMENT_VALUES: DropdownItem[] = [
  { text: '0.1', value: 0.1 },
  { text: '0.05', value: 0.05 }
]

export default function PlayerSettingsModal({ isOpen, settings, onClose, onUpdateSettings }: PlayerSettingsModalProps) {
  const t = useTypeSafeTranslations()

  // Jump time values in seconds
  const JUMP_VALUES: DropdownItem[] = [
    { text: t('LabelTimeDurationXSeconds', { 0: 10 }), value: 10 },
    { text: t('LabelTimeDurationXSeconds', { 0: 15 }), value: 15 },
    { text: t('LabelTimeDurationXSeconds', { 0: 30 }), value: 30 },
    { text: t('LabelTimeDurationXSeconds', { 0: 60 }), value: 60 },
    { text: t('LabelTimeDurationXMinutes', { 0: 2 }), value: 120 },
    { text: t('LabelTimeDurationXMinutes', { 0: 5 }), value: 300 }
  ]

  const handleUseChapterTrackChange = (value: boolean) => {
    onUpdateSettings({ useChapterTrack: value })
  }

  const handleShowBookTrackWithChapterTrackChange = (value: boolean) => {
    onUpdateSettings({ showBookTrackWithChapterTrack: value })
  }

  const handleShowCoverProgressRingChange = (value: boolean) => {
    onUpdateSettings({ showCoverProgressRing: value })
  }

  const handleShowQueueButtonChange = (value: boolean) => {
    onUpdateSettings({ showQueueButton: value })
  }

  const handleShowFullscreenCornerButtonsChange = (value: boolean) => {
    onUpdateSettings({ showFullscreenCornerButtons: value })
  }

  const handleAmoledPlayerSurfacesChange = (value: boolean) => {
    onUpdateSettings({ amoledPlayerSurfaces: value })
  }

  const handleShowBookmarksInPlayerBarChange = (value: boolean) => {
    onUpdateSettings({ showBookmarksInPlayerBar: value })
  }

  const handleShowVolumeInPlayerBarChange = (value: boolean) => {
    onUpdateSettings({ showVolumeInPlayerBar: value })
  }

  const handleAutoOpenFullscreenOnPlayChange = (value: boolean) => {
    onUpdateSettings({ autoOpenFullscreenOnPlay: value })
  }

  const handleUseLegacySleepTimerDialogChange = (value: boolean) => {
    onUpdateSettings({ useLegacySleepTimerDialog: value })
  }

  const handleUseLegacyBookmarksDialogChange = (value: boolean) => {
    onUpdateSettings({ useLegacyBookmarksDialog: value })
  }

  const handleJumpForwardChange = (value: string | number) => {
    onUpdateSettings({ jumpForwardAmount: value as number })
  }

  const handleJumpBackwardChange = (value: string | number) => {
    onUpdateSettings({ jumpBackwardAmount: value as number })
  }

  const handlePlaybackRateIncrementChange = (value: string | number) => {
    onUpdateSettings({ playbackRateIncrementDecrement: value as 0.1 | 0.05 })
  }

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderPlayerSettings')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="sm:max-w-md md:max-w-md lg:max-w-md">
      <div className="max-h-[80vh] w-full overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          {/* Use chapter track toggle */}
          <ToggleSwitch value={settings.useChapterTrack} label={t('LabelUseChapterTrack')} onChange={handleUseChapterTrackChange} />

          {/* Only means anything while the chapter track is on */}
          {settings.useChapterTrack && (
            <ToggleSwitch
              value={settings.showBookTrackWithChapterTrack}
              label={t('LabelShowBookTrackWithChapterTrack')}
              onChange={handleShowBookTrackWithChapterTrackChange}
            />
          )}

          {/* Jump forward amount dropdown */}
          <Dropdown label={t('LabelJumpForwardAmount')} value={settings.jumpForwardAmount} items={JUMP_VALUES} onChange={handleJumpForwardChange} usePortal />

          {/* Jump backward amount dropdown */}
          <Dropdown
            label={t('LabelJumpBackwardAmount')}
            value={settings.jumpBackwardAmount}
            items={JUMP_VALUES}
            onChange={handleJumpBackwardChange}
            usePortal
          />

          {/* Playback rate increment/decrement dropdown */}
          <Dropdown
            label={t('LabelPlaybackRateIncrementDecrement')}
            value={settings.playbackRateIncrementDecrement}
            items={PLAYBACK_RATE_INCREMENT_VALUES}
            onChange={handlePlaybackRateIncrementChange}
            usePortal
          />

          {/* Appearance — everything below only changes what the player draws */}
          <div className="border-border border-t pt-5">
            <div className="flex flex-col gap-5">
              <ToggleSwitch value={settings.showCoverProgressRing} label={t('LabelShowCoverProgressRing')} onChange={handleShowCoverProgressRingChange} />
              <ToggleSwitch value={settings.showQueueButton} label={t('LabelShowQueueButton')} onChange={handleShowQueueButtonChange} />
              <ToggleSwitch
                value={settings.showBookmarksInPlayerBar}
                label={t('LabelShowBookmarksInPlayerBar')}
                onChange={handleShowBookmarksInPlayerBarChange}
              />
              <ToggleSwitch value={settings.showVolumeInPlayerBar} label={t('LabelShowVolumeInPlayerBar')} onChange={handleShowVolumeInPlayerBarChange} />
              <ToggleSwitch
                value={settings.autoOpenFullscreenOnPlay}
                label={t('LabelAutoOpenFullscreenOnPlay')}
                onChange={handleAutoOpenFullscreenOnPlayChange}
              />
              <ToggleSwitch
                value={settings.showFullscreenCornerButtons}
                label={t('LabelShowFullscreenCornerButtons')}
                onChange={handleShowFullscreenCornerButtonsChange}
              />
              <ToggleSwitch value={settings.amoledPlayerSurfaces} label={t('LabelAmoledPlayerSurfaces')} onChange={handleAmoledPlayerSurfacesChange} />
              <ToggleSwitch
                value={settings.useLegacySleepTimerDialog}
                label={t('LabelUseLegacySleepTimerDialog')}
                onChange={handleUseLegacySleepTimerDialogChange}
              />
              <ToggleSwitch
                value={settings.useLegacyBookmarksDialog}
                label={t('LabelUseLegacyBookmarksDialog')}
                onChange={handleUseLegacyBookmarksDialogChange}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
