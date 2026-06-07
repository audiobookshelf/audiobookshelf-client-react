'use client'

import Modal from '@/components/modals/Modal'
import RangeInput from '@/components/ui/RangeInput'
import ToggleButtonGroup from '@/components/ui/ToggleButtonGroup'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EreaderFont, EreaderSettings, EreaderSpread, EreaderTheme } from '@/lib/ereader/ereaderSettings'
import { supportsReflowableSettings } from '@/lib/ereader/ereaderSettings'
import type { ReactNode } from 'react'

interface EreaderSettingsModalProps {
  isOpen: boolean
  ebookFormat: string
  settings: EreaderSettings
  onChange: (patch: Partial<EreaderSettings>) => void
  onClose: () => void
}

export default function EreaderSettingsModal({ isOpen, ebookFormat, settings, onChange, onClose }: EreaderSettingsModalProps) {
  const t = useTypeSafeTranslations()
  const showReflowableSettings = supportsReflowableSettings(ebookFormat)

  const themeItems = [
    { text: t('LabelThemeDark'), value: 'dark' },
    { text: t('LabelThemeSepia'), value: 'sepia' },
    { text: t('LabelThemeLight'), value: 'light' }
  ]

  const fontItems = [
    { text: 'Sans', value: 'sans-serif' },
    { text: 'Serif', value: 'serif' }
  ]

  const spreadItems = [
    { text: t('LabelLayoutSinglePage'), value: 'none' },
    { text: t('LabelLayoutSplitPage'), value: 'auto' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      zIndexClass="z-[90]"
      outerContent={
        <div className="absolute start-0 top-0 p-4">
          <p className="text-xl text-white">{t('HeaderEreaderSettings')}</p>
        </div>
      }
      className="w-[500px]"
    >
      <div className="relative max-h-[80vh] w-full overflow-x-hidden overflow-y-auto p-4 md:p-8">
        <SettingRow label={t('LabelTheme')}>
          <ToggleButtonGroup items={themeItems} value={settings.theme} onChange={(value) => onChange({ theme: value as EreaderTheme })} />
        </SettingRow>

        {showReflowableSettings && (
          <>
            <SettingRow label={t('LabelFontFamily')}>
              <ToggleButtonGroup items={fontItems} value={settings.font} onChange={(value) => onChange({ font: value as EreaderFont })} />
            </SettingRow>

            <SettingRow label={t('LabelFontScale')}>
              <RangeInput value={settings.fontScale} min={5} max={300} step={5} borderless onChange={(value) => onChange({ fontScale: value })} />
            </SettingRow>

            <SettingRow label={t('LabelLineSpacing')}>
              <RangeInput value={settings.lineSpacing} min={100} max={300} step={5} borderless onChange={(value) => onChange({ lineSpacing: value })} />
            </SettingRow>

            <SettingRow label={t('LabelFontBoldness')}>
              <RangeInput value={settings.textStroke} min={0} max={300} step={5} borderless onChange={(value) => onChange({ textStroke: value })} />
            </SettingRow>

            <SettingRow label={t('LabelLayout')} className="mb-0">
              <ToggleButtonGroup items={spreadItems} value={settings.spread} onChange={(value) => onChange({ spread: value as EreaderSpread })} />
            </SettingRow>
          </>
        )}
      </div>
    </Modal>
  )
}

function SettingRow({ label, children, className = 'mb-4' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-32 shrink-0">
        <p className="text-base">{label}</p>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
