import ToggleSwitch from '@/components/ui/ToggleSwitch'
import Tooltip from '@/components/ui/Tooltip'

interface SettingsToggleSwitchProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  disabled: boolean
  tooltip?: string
}

export default function SettingsToggleSwitch(props: SettingsToggleSwitchProps) {
  return (
    <div className="flex items-center">
      <ToggleSwitch label={props.label} value={props.value} onChange={props.onChange} disabled={props.disabled} />
      {props.tooltip && (
        <Tooltip text={props.tooltip} position="right" maxWidth={300} className="-ml-2">
          <span className="material-symbols text-lg">info</span>
        </Tooltip>
      )}
    </div>
  )
}
