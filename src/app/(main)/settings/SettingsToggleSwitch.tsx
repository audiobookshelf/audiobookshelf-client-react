import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import type { ReactNode } from 'react'

interface SettingsToggleSwitchProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  tooltip?: ReactNode
}

export default function SettingsToggleSwitch(props: SettingsToggleSwitchProps) {
  return (
    <div className="flex items-center">
      <ToggleSwitch label={props.label} className="px-0" value={props.value} onChange={props.onChange} disabled={props.disabled ?? false} />
      {props.tooltip && <HelpTooltipIcon text={props.tooltip} />}
    </div>
  )
}
