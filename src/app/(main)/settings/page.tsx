import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import SettingsContent from './SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  const t = await getTypeSafeTranslations()

  return (
    <SettingsContent title={t('HeaderSettings')}>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsGeneral')}</h2>
          <div className="flex items-center gap-2">
            <ToggleSwitch label={t('LabelSettingsStoreCoversWithItem')} disabled />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsScanner')}</h2>
          <div className="flex items-center gap-2">
            <ToggleSwitch label={t('LabelSettingsParseSubtitles')} disabled />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t('HeaderSettingsWebClient')}</h2>
          <div className="flex items-center gap-2">
            <ToggleSwitch label={t('LabelSettingsChromecastSupport')} disabled />
          </div>
        </div>
      </div>
    </SettingsContent>
  )
}
