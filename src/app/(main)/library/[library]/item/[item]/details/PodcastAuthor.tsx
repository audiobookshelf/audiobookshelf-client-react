import { EditableField } from '@/components/details/EditableField'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface PodcastAuthorProps {
  author: string | undefined
  onSave: (val: string) => Promise<void>
}

export function PodcastAuthor({ author, onSave }: PodcastAuthorProps) {
  const t = useTypeSafeTranslations()

  return (
    <EditableField<string>
      value={author || ''}
      onSave={onSave}
      className="mt-0.5"
      renderView={({ value }) =>
        value ? ( //
          <div className="w-full text-lg md:text-xl leading-9 text-foreground-muted">{t('LabelByAuthor', { 0: value })}</div>
        ) : null
      }
      renderEdit={({ value, onChange }) => (
        <TextInput //
          value={value}
          onChange={onChange}
          placeholder={t('LabelAuthor')}
          className="w-full"
          size="small"
          autoFocus
        />
      )}
    />
  )
}
