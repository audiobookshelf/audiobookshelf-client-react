import { MetadataField } from '@/components/details/MetadataField'
import TextInput from '@/components/ui/TextInput'
import { filterEncode } from '@/lib/filterUtils'
import Link from 'next/link'

type MetadataTextFieldValue = string | undefined | null

interface MetadataTextFieldProps {
  label: string
  value: MetadataTextFieldValue
  onSave: (val: string) => Promise<void>
  libraryId?: string
  filterKey?: string
  type?: 'text' | 'number'
  openInEditMode?: boolean
  onCancel?: () => void
}

/**
 * Specialized MetadataField for text input fields (Publisher, Language, ISBN, ASIN, etc.).
 * Renders text (optional link) in View mode.
 * Renders TextInput in Edit mode.
 */
export function MetadataTextField({ label, value, onSave, libraryId, filterKey, type = 'text', openInEditMode, onCancel }: MetadataTextFieldProps) {
  return (
    <MetadataField
      label={label}
      value={value}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      onSave={async (val) => {
        // Ensure we pass a string to onSave, defaulting to empty string if null/undefined
        await onSave(val || '')
      }}
      renderView={(val) => {
        if (!val) return null
        if (libraryId && filterKey) {
          return (
            <Link
              href={`/library/${libraryId}/items?filter=${filterKey}.${filterEncode(val)}`}
              className="text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {val}
            </Link>
          )
        }
        return val
      }}
      renderEdit={(val, onChange) => <TextInput value={val || ''} onChange={onChange} type={type} className="w-full" size="small" autoFocus />}
    />
  )
}
