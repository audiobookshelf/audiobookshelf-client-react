import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import { useMemo } from 'react'

interface AddFieldProps {
  availableFields: { key: string; label: string }[]
  onAdd: (key: string) => void
  disabled?: boolean
  className?: string
}

export default function AddField({ availableFields, onAdd, disabled, className }: AddFieldProps) {
  const items = useMemo<DropdownItem[]>(
    () =>
      availableFields.map((field) => ({
        text: field.label,
        value: field.key
      })),
    [availableFields]
  )

  if (availableFields.length === 0) return null

  return (
    <Dropdown
      label=""
      displayText="Add Field"
      items={items}
      onChange={(val) => onAdd(String(val))}
      className={className}
      disabled={disabled}
      size="small"
      rightIcon={<span className="material-symbols text-xl">add_circle</span>}
    />
  )
}
