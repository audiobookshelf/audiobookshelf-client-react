import { MetadataField } from '@/components/details/MetadataField'
import Checkbox from '@/components/ui/Checkbox'

interface MetadataCheckboxFieldProps {
  label: string
  value: boolean
  onSave: (val: boolean) => Promise<void>
  openInEditMode?: boolean
  onCancel?: () => void
}

/**
 * Specialized MetadataField for boolean checkbox fields (Explicit, Abridged, etc.).
 * Renders a checkmark or empty in View mode.
 * Renders a Checkbox in Edit mode.
 */
export function MetadataCheckboxField({ label, value, onSave, openInEditMode, onCancel }: MetadataCheckboxFieldProps) {
  return (
    <MetadataField
      label={label}
      value={value}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      onSave={async (val) => {
        await onSave(!!val)
      }}
      renderView={(val) => (val ? '✓' : '✗')}
      renderEdit={(val, onChange) => <Checkbox value={!!val} onChange={() => onChange(!val)} label={val ? 'Yes' : 'No'} autoFocus />}
    />
  )
}
