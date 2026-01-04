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

  const handleJumpForwardChange = (value: string | number) => {
    onUpdateSettings({ jumpForwardAmount: value as number })
  }

  const handleJumpBackwardChange = (value: string | number) => {
    onUpdateSettings({ jumpBackwardAmount: value as number })
  }

  const handlePlaybackRateIncrementChange = (value: string | number) => {
    onUpdateSettings({ playbackRateIncrementDecrement: value as 0.1 | 0.05 })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-md md:max-w-md lg:max-w-md">
      <div className="p-6 flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-foreground">{t('HeaderPlayerSettings')}</h2>

        <div className="flex flex-col gap-5">
          {/* Use chapter track toggle */}
          <ToggleSwitch value={settings.useChapterTrack} label={t('LabelUseChapterTrack')} onChange={handleUseChapterTrackChange} />

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
        </div>
      </div>
    </Modal>
  )
}
