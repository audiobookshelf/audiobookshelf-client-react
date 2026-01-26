import { EditableField } from '@/components/details/EditableField'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Author } from '@/types/api'
import Link from 'next/link'
import { Fragment } from 'react'

interface BookAuthorsProps {
  authors: Author[]
  libraryId: string
  availableAuthors: MultiSelectItem<string>[]
  onSave: (authors: Author[]) => Promise<void>
  /** Page-level edit mode control */
  pageEditMode?: boolean
  /** Whether to open in edit mode when mounted */
  openInEditMode?: boolean
  /** Callback when editing is cancelled */
  onCancel?: () => void
}

export function BookAuthors({ authors, libraryId, availableAuthors, onSave, pageEditMode, openInEditMode, onCancel }: BookAuthorsProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="w-full text-lg md:text-xl flex items-center gap-1">
      <div className="text-foreground-muted whitespace-nowrap">by </div>
      <EditableField
        value={authors || []}
        onSave={onSave}
        className="flex-1 min-w-0"
        pageEditMode={pageEditMode}
        openInEditMode={openInEditMode}
        onCancel={onCancel}
        renderView={({ value }) => (
          <div>
            {pageEditMode ? (
              !value || value.length === 0 ? (
                <div className="text-foreground-muted opacity-50 italic">{t('LabelAuthors')}</div>
              ) : (
                <span className="text-foreground-muted">{value.map((a) => a.name).join(', ')}</span>
              )
            ) : (
              value.map((author, index) => (
                <Fragment key={author.id}>
                  <Link
                    href={`/library/${libraryId}/authors/${author.id}`}
                    className="text-foreground-muted hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {author.name}
                  </Link>
                  {index < value.length - 1 && <span>, </span>}
                </Fragment>
              ))
            )}
          </div>
        )}
        renderEdit={({ value, onChange }) => (
          <MultiSelect
            selectedItems={value.map((a) => ({ value: a.id, content: a.name }))}
            onItemAdded={(item) => onChange([...value, { id: item.value, name: item.content }])}
            onItemRemoved={(item) => onChange(value.filter((a) => a.id !== item.value))}
            items={availableAuthors}
            allowNew
            className="flex-1 min-w-0"
            size="small"
            autoFocus
          />
        )}
      />
    </div>
  )
}
