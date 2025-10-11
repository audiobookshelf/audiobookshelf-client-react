'use client'

import Dropdown from '@/components/ui/Dropdown'
import { MultiSelect, MultiSelectItem } from '@/components/ui/MultiSelect'
import LanguageDropdown from '@/components/widgets/LanguageDropdown'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { BookshelfView, ServerSettings } from '@/types/api'
import { useMemo, useState, useTransition } from 'react'
import { dateFormats, timeFormats } from './settingsConstants'
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

  const corsAllowedItems = useMemo(() => {
    return (
      (serverSettings?.allowedOrigins || []).map?.((origin) => ({
        content: origin,
        value: origin
      })) || []
    )
  }, [serverSettings?.allowedOrigins])

  const exampleDateFormat = useMemo(() => {
    if (!serverSettings?.dateFormat) {
      return ''
    }
    return formatJsDate(new Date(2025, 9, 25), serverSettings.dateFormat)
  }, [serverSettings?.dateFormat])

  const exampleTimeFormat = useMemo(() => {
    if (!serverSettings?.timeFormat) {
      return ''
    }
    return formatJsDate(new Date(2025, 9, 25, 17, 30, 0), serverSettings.timeFormat)
  }, [serverSettings?.timeFormat])

  const handleSaveSettings = (updatedSettings: ServerSettings) => {
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

  const handleSettingChanged = (key: keyof ServerSettings, value: boolean | string | string[]) => {
    let newValue: boolean | BookshelfView | string | string[] = value
    if (key === 'homeBookshelfView' || key === 'bookshelfView') {
      newValue = value ? BookshelfView.STANDARD : BookshelfView.DETAIL
    }
    const updatedSettings = { ...serverSettings, [key]: newValue } as ServerSettings
    handleSaveSettings(updatedSettings)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsGeneral')}</h2>
          <SettingsToggleSwitch
            label={t('LabelSettingsStoreCoversWithItem')}
            value={serverSettings?.storeCoverWithItem}
            onChange={(value) => handleSettingChanged('storeCoverWithItem', value)}
            disabled={isPending}
            tooltip={t('LabelSettingsStoreCoversWithItemHelp')}
          />
          <SettingsToggleSwitch
            label={t('LabelSettingsStoreMetadataWithItem')}
            value={serverSettings?.storeMetadataWithItem}
            onChange={(value) => handleSettingChanged('storeMetadataWithItem', value)}
            disabled={isPending}
            tooltip={t('LabelSettingsStoreMetadataWithItemHelp')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsScanner')}</h2>
          <SettingsToggleSwitch
            label={t('LabelSettingsParseSubtitles')}
            value={serverSettings?.scannerParseSubtitle}
            onChange={(value) => handleSettingChanged('scannerParseSubtitle', value)}
            disabled={isPending}
            tooltip={t.rich('LabelSettingsParseSubtitlesHelp', {
              br: () => <br />
            })}
          />
          <SettingsToggleSwitch
            label={t('LabelSettingsFindCovers')}
            value={serverSettings?.scannerFindCovers}
            onChange={(value) => handleSettingChanged('scannerFindCovers', value)}
            disabled={isPending}
            tooltip={t.rich('LabelSettingsFindCoversHelp', {
              br: () => <br />
            })}
          />
          <SettingsToggleSwitch
            label={t('LabelSettingsPreferMatchedMetadata')}
            value={serverSettings?.scannerPreferMatchedMetadata}
            onChange={(value) => handleSettingChanged('scannerPreferMatchedMetadata', value)}
            disabled={isPending}
            tooltip={t('LabelSettingsPreferMatchedMetadataHelp')}
          />
          <SettingsToggleSwitch
            label={t('LabelSettingsEnableWatcher')}
            value={!serverSettings?.scannerDisableWatcher}
            onChange={(value) => handleSettingChanged('scannerDisableWatcher', !value)}
            disabled={isPending}
            tooltip={t('LabelSettingsEnableWatcherHelp')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsWebClient')}</h2>

          <SettingsToggleSwitch
            label={t('LabelSettingsChromecastSupport')}
            value={serverSettings?.chromecastEnabled}
            onChange={(value) => handleSettingChanged('chromecastEnabled', value)}
            disabled={isPending}
          />

          <SettingsToggleSwitch
            label={t('LabelSettingsAllowIframe')}
            value={serverSettings?.allowIframe}
            onChange={(value) => handleSettingChanged('allowIframe', value)}
            disabled={isPending}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsDisplay')}</h2>
          <SettingsToggleSwitch
            label={t('LabelSettingsHomePageBookshelfView')}
            value={serverSettings?.homeBookshelfView === BookshelfView.STANDARD}
            onChange={(value) => handleSettingChanged('homeBookshelfView', value)}
            disabled={isPending}
            tooltip={t('LabelSettingsBookshelfViewHelp')}
          />
          <SettingsToggleSwitch
            label={t('LabelSettingsLibraryBookshelfView')}
            value={serverSettings?.bookshelfView === BookshelfView.STANDARD}
            onChange={(value) => handleSettingChanged('bookshelfView', value)}
            disabled={isPending}
            tooltip={t('LabelSettingsBookshelfViewHelp')}
          />
          <div className="w-full max-w-72">
            <Dropdown
              items={dateFormats}
              label={t('LabelSettingsDateFormat')}
              value={serverSettings?.dateFormat}
              onChange={(value) => handleSettingChanged('dateFormat', value as string)}
            />
            <p className="text-xs text-gray-300 px-1 mb-2">
              {t('LabelExample')}: {exampleDateFormat}
            </p>
          </div>
          <div className="w-full max-w-72">
            <Dropdown
              items={timeFormats}
              label={t('LabelSettingsTimeFormat')}
              value={serverSettings?.timeFormat}
              onChange={(value) => handleSettingChanged('timeFormat', value as string)}
            />
            <p className="text-xs text-gray-300 px-1 mb-2">
              {t('LabelExample')}: {exampleTimeFormat}
            </p>
          </div>
          <div className="w-full max-w-72">
            <LanguageDropdown value={serverSettings?.language} onChange={(value) => handleSettingChanged('language', value as string)} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsSecurity')}</h2>
          <div className="w-full max-w-72">
            <MultiSelect
              label={t('LabelCorsAllowed')}
              items={corsAllowedItems}
              showEdit
              onItemEdited={(value: MultiSelectItem<string>) => {
                handleSettingChanged('allowedOrigins', serverSettings?.allowedOrigins?.map((item) => (item === value.value ? value.content : item)) as string[])
              }}
              onItemRemoved={(value: MultiSelectItem<string>) => {
                handleSettingChanged('allowedOrigins', serverSettings?.allowedOrigins?.filter((item) => item !== value.content) as string[])
              }}
              onItemAdded={(value: MultiSelectItem<string>) => {
                if (!corsAllowedItems.some((item) => item.content === value.content)) {
                  handleSettingChanged('allowedOrigins', [...serverSettings?.allowedOrigins, value.content] as string[])
                } else {
                  handleSettingChanged('allowedOrigins', serverSettings?.allowedOrigins?.filter((item) => item !== value.content) as string[])
                }
              }}
              selectedItems={corsAllowedItems}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
