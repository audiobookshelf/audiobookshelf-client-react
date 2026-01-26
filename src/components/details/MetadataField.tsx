import { DetailRow } from '@/components/details/DetailRow'
import { EditableField } from '@/components/details/EditableField'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ReactNode } from 'react'

interface MetadataFieldProps<T> {
  label: string
  value: T
  renderView: (value: T) => ReactNode
  renderEdit: (value: T, onChange: (newValue: T) => void) => ReactNode
  onSave: (value: T) => Promise<void>
  openInEditMode?: boolean
  onCancel?: () => void
  /** Page-level edit mode control - passed to EditableField */
  pageEditMode?: boolean
}

/**
 * Generic component for rendering a metadata field row with label, value, and edit mode.
 * Uses EditableField for switching modes and DetailRow for layout.
 */
export function MetadataField<T>({ label, value, renderView, renderEdit, onSave, openInEditMode, onCancel, pageEditMode }: MetadataFieldProps<T>) {
  const t = useTypeSafeTranslations()

  return (
    <EditableField<T>
      value={value}
      onSave={onSave}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      pageEditMode={pageEditMode}
      renderView={({ value: v }) => (
        <DetailRow
          label={label}
          value={renderView(v) || <span className="text-foreground-muted opacity-50 italic">{pageEditMode ? t('LabelAdd') : t('LabelNone')}</span>}
        />
      )}
      renderEdit={({ value: v, onChange }) => <DetailRow label={label}>{renderEdit(v, onChange)}</DetailRow>}
    />
  )
}
