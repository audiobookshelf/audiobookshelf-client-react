import { EditableField } from '@/components/details/EditableField'
import TextInput from '@/components/ui/TextInput'
import AbridgedIndicator from '@/components/widgets/AbridgedIndicator'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookMetadata } from '@/types/api'

interface BookTitleProps {
  metadata: BookMetadata
  onSave: (val: { title: string | undefined }) => Promise<void>
  /** Force open in edit mode */
  openInEditMode?: boolean
}

export function BookTitle({ metadata, onSave, openInEditMode }: BookTitleProps) {
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()

  return (
    <EditableField
      value={metadata.title || ''}
      openInEditMode={openInEditMode}
      onSave={async (val) => {
        if (!val || !val.trim()) {
          showToast(t('ErrorUploadLacksTitle'), { type: 'error' })
          return
        }
        await onSave({ title: val })
      }}
      renderView={({ value }) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl md:text-3xl font-semibold">{value}</span>
          <div className="flex items-center gap-2 min-h-[24px]">
            {metadata.explicit && <ExplicitIndicator />}
            {metadata.abridged && <AbridgedIndicator />}
          </div>
        </div>
      )}
      renderEdit={({ value, onChange }) => (
        <TextInput value={value} onChange={onChange} className="text-xl md:text-2xl font-bold flex-1 min-w-0" size="medium" autoFocus />
      )}
    />
  )
}
