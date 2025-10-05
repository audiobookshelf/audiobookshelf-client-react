'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ServerSettings } from '@/types/api'
import { useState, useTransition } from 'react'
import SettingsToggleSwitch from './SettingsToggleSwitch'

interface SettingsClientProps {
  serverSettings: ServerSettings
  updateServerSettings: (serverSettings: ServerSettings) => Promise<any>
}

export default function SettingsClient(props: SettingsClientProps) {
  const { serverSettings: initialServerSettings, updateServerSettings } = props
  const t = useTypeSafeTranslations()
  const [isPending, startTransition] = useTransition()
  const [serverSettings, setServerSettings] = useState(initialServerSettings)

  const handleToggleChange = (key: keyof ServerSettings, value: boolean) => {
    const updatedSettings = { ...serverSettings, [key]: value } as ServerSettings

    // Optimistically update the UI
    setServerSettings(updatedSettings)

    // Send the update to the server
    startTransition(async () => {
      try {
        const response = await updateServerSettings(updatedSettings)
        if (response?.data?.serverSettings) {
          // Update with the actual server response
          setServerSettings(response.data.serverSettings)
        }
      } catch (error) {
        // Revert on error
        setServerSettings(serverSettings)
        console.error('Failed to update server settings:', error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t('HeaderSettingsGeneral')}</h2>
        <SettingsToggleSwitch
          label={t('LabelSettingsStoreCoversWithItem')}
          value={serverSettings?.storeCoverWithItem}
          onChange={(value) => handleToggleChange('storeCoverWithItem', value)}
          disabled={isPending}
          tooltip={t('LabelSettingsStoreCoversWithItemHelp')}
        />
        <SettingsToggleSwitch
          label={t('LabelSettingsStoreMetadataWithItem')}
          value={serverSettings?.storeMetadataWithItem}
          onChange={(value) => handleToggleChange('storeMetadataWithItem', value)}
          disabled={isPending}
          tooltip={t('LabelSettingsStoreMetadataWithItemHelp')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t('HeaderSettingsScanner')}</h2>
        <SettingsToggleSwitch
          label={t('LabelSettingsParseSubtitles')}
          value={serverSettings?.scannerParseSubtitle}
          onChange={(value) => handleToggleChange('scannerParseSubtitle', value)}
          disabled={isPending}
          tooltip={t.rich('LabelSettingsParseSubtitlesHelp', {
            br: () => <br />
          })}
        />
        <SettingsToggleSwitch
          label={t('LabelSettingsFindCovers')}
          value={serverSettings?.scannerFindCovers}
          onChange={(value) => handleToggleChange('scannerFindCovers', value)}
          disabled={isPending}
          tooltip={t.rich('LabelSettingsFindCoversHelp', {
            br: () => <br />
          })}
        />
        <SettingsToggleSwitch
          label={t('LabelSettingsPreferMatchedMetadata')}
          value={serverSettings?.scannerPreferMatchedMetadata}
          onChange={(value) => handleToggleChange('scannerPreferMatchedMetadata', value)}
          disabled={isPending}
          tooltip={t('LabelSettingsPreferMatchedMetadataHelp')}
        />
        <SettingsToggleSwitch
          label={t('LabelSettingsEnableWatcher')}
          value={!serverSettings?.scannerDisableWatcher}
          onChange={(value) => handleToggleChange('scannerDisableWatcher', !value)}
          disabled={isPending}
          tooltip={t('LabelSettingsEnableWatcherHelp')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t('HeaderSettingsWebClient')}</h2>

        <SettingsToggleSwitch
          label={t('LabelSettingsChromecastSupport')}
          value={serverSettings?.chromecastEnabled}
          onChange={(value) => handleToggleChange('chromecastEnabled', value)}
          disabled={isPending}
        />

        <SettingsToggleSwitch
          label={t('LabelSettingsAllowIframe')}
          value={serverSettings?.allowIframe}
          onChange={(value) => handleToggleChange('allowIframe', value)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}
