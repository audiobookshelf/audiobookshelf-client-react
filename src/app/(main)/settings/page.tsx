import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { getCurrentUser, getData } from '../../../lib/api'
import SettingsContent from './SettingsContent'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  const [userResponse] = await getData(getCurrentUser())
  const user = userResponse.data?.user

  return (
    <SettingsContent title="Settings">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">General</h2>
          <div className="flex items-center gap-2">
            <ToggleSwitch label="Store covers with item" disabled />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">Scanner</h2>
          <div className="flex items-center gap-2">
            <ToggleSwitch label="Parse subtitles" disabled />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">Web Client</h2>
          <div className="flex items-center gap-2">
            <ToggleSwitch label="Chromecast support" disabled />
          </div>
        </div>
      </div>
    </SettingsContent>
  )
}
