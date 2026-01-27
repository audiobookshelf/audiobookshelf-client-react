import { EditableField } from '@/components/details/EditableField'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface BookSubtitleProps {
  value: string | undefined
  onSave: (val: string) => Promise<void>
  openInEditMode?: boolean
  onCancel?: () => void
}

export function BookSubtitle({ value, onSave, openInEditMode, onCancel }: BookSubtitleProps) {
  const t = useTypeSafeTranslations()

  // Note: Visibility check is done by parent to avoid mounting if not needed,
  // or we can pass `visible` prop. Here we assume it's rendered if visible.

  return (
    <EditableField
      value={value || ''}
      onSave={onSave}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      renderView={({ value: v }) =>
        v ? (
          <div className="text-xl md:text-2xl font-medium text-foreground-muted">{v}</div>
        ) : (
          <div className="text-xl md:text-2xl text-foreground-muted opacity-50 italic">{t('LabelAddSubtitle')}</div>
        )
      }
      renderEdit={({ value: v, onChange }) => <TextInput value={v} onChange={onChange} autoFocus />}
    />
  )
}
