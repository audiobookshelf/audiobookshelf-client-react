import { EditableField } from '@/components/details/EditableField'
import ExpandableText from '@/components/ui/ExpandableText'
import SlateEditor from '@/components/ui/SlateEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface ItemDescriptionProps {
  description: string | undefined
  onSave: (val: string) => Promise<void>
  openInEditMode?: boolean
  onCancel?: () => void
}

export function ItemDescription({ description, onSave, openInEditMode, onCancel }: ItemDescriptionProps) {
  const t = useTypeSafeTranslations()

  return (
    <EditableField<string>
      value={description || ''}
      onSave={onSave}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      className="mt-4"
      renderView={({ value }) =>
        value ? (
          <ExpandableText html={value} className="text-foreground-muted w-full" />
        ) : (
          <div className="text-foreground-muted/50 italic p-2">{t('LabelDescription')}</div>
        )
      }
      renderEdit={({ onChange }) => {
        return <SlateEditor srcContent={description || ''} onUpdate={onChange} autoFocus />
      }}
    />
  )
}
