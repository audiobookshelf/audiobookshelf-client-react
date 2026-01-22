import { MetadataField } from '@/components/details/MetadataField'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import { filterEncode } from '@/lib/filterUtils'
import Link from 'next/link'
import { Fragment } from 'react'

interface MetadataMultiSelectFieldProps {
  label: string
  items: string[]
  availableItems: MultiSelectItem<string>[]
  libraryId: string
  filterKey: string
  onSave: (items: string[]) => Promise<void>
  openInEditMode?: boolean
  onCancel?: () => void
  /** Page-level edit mode control */
  pageEditMode?: boolean
}

/**
 * Specialized MetadataField for multi-select items (Narrators, Genres, Tags).
 * Renders comma-separated links in View mode.
 * Renders MultiSelect in Edit mode.
 */
export function MetadataMultiSelectField({
  label,
  items = [],
  availableItems,
  libraryId,
  filterKey,
  onSave,
  openInEditMode,
  onCancel,
  pageEditMode
}: MetadataMultiSelectFieldProps) {
  return (
    <MetadataField
      label={label}
      value={items}
      onSave={onSave}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      pageEditMode={pageEditMode}
      renderView={(val) =>
        val.length > 0 ? (
          <div>
            {pageEditMode ? (
              <span>{val.join(', ')}</span>
            ) : (
              val.map((v, i) => (
                <Fragment key={v}>
                  <Link
                    href={`/library/${libraryId}/items?filter=${filterKey}.${filterEncode(v)}`}
                    className="text-foreground hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {v}
                  </Link>
                  {i < val.length - 1 && <span className="text-foreground">, </span>}
                </Fragment>
              ))
            )}
          </div>
        ) : null
      }
      renderEdit={(val, onChange) => (
        <MultiSelect
          selectedItems={val.map((item) => ({ value: item, content: item }))}
          onItemAdded={(item) => onChange([...val, item.content])}
          onItemRemoved={(item) => onChange(val.filter((i) => i !== item.content))}
          items={availableItems}
          allowNew
          size="small"
          autoFocus
        />
      )}
    />
  )
}
