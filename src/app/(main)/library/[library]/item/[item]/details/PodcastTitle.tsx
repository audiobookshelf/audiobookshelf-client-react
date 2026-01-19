import { EditableField } from '@/components/details/EditableField'
import Checkbox from '@/components/ui/Checkbox'
import TextInput from '@/components/ui/TextInput'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { PodcastMetadata } from '@/types/api'

interface PodcastTitleProps {
  metadata: PodcastMetadata
  onSave: (val: { title: string | undefined; explicit: boolean }) => Promise<void>
}

export function PodcastTitle({ metadata, onSave }: PodcastTitleProps) {
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()

  return (
    <EditableField
      value={{ title: metadata.title || '', explicit: !!metadata.explicit }}
      onSave={async (val) => {
        if (!val.title || !val.title.trim()) {
          showToast(t('ErrorUploadLacksTitle'), { type: 'error' })
          return
        }
        await onSave({ title: val.title, explicit: val.explicit })
      }}
      renderView={({ value }) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl md:text-3xl font-semibold">{value.title}</span>
          <div className="flex items-center gap-2 min-h-[24px]">{value.explicit && <ExplicitIndicator />}</div>
        </div>
      )}
      renderEdit={({ value, onChange }) => (
        <div className="flex items-center gap-4 w-full">
          <TextInput
            value={value.title}
            onChange={(newTitle) => onChange({ ...value, title: newTitle })}
            className="text-xl md:text-2xl font-bold flex-1 min-w-0"
            size="medium"
            autoFocus
          />
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Checkbox value={value.explicit} onChange={() => onChange({ ...value, explicit: !value.explicit })} />
              <ExplicitIndicator className="text-foreground" />
            </div>
          </div>
        </div>
      )}
    />
  )
}
