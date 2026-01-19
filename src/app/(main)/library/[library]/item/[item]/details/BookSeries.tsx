import { EditableField } from '@/components/details/EditableField'
import { MultiSelectItem } from '@/components/ui/MultiSelect'
import TwoStageMultiSelect from '@/components/ui/TwoStageMultiSelect'
import { Series } from '@/types/api'
import Link from 'next/link'
import { Fragment } from 'react'

interface BookSeriesProps {
  series: Series[]
  libraryId: string
  availableSeries: MultiSelectItem<string>[]
  onSave: (series: Series[]) => Promise<void>
  openInEditMode?: boolean
  onCancel?: () => void
}

export function BookSeries({ series, libraryId, availableSeries, onSave, openInEditMode, onCancel }: BookSeriesProps) {
  // Note: Visibility checked in parent

  return (
    <EditableField
      value={series || []}
      onSave={onSave}
      openInEditMode={openInEditMode}
      onCancel={onCancel}
      renderView={({ value }) => (
        <div className="w-full">
          {value.map((s, index) => (
            <Fragment key={s.id}>
              <Link
                href={`/library/${libraryId}/series/${s.id}`}
                className="text-foreground-muted hover:underline text-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {s.name}
                {s.sequence && <span> #{s.sequence}</span>}
              </Link>
              {index < value.length - 1 && <span className="text-foreground-muted">, </span>}
            </Fragment>
          ))}
        </div>
      )}
      renderEdit={({ value, onChange }) => (
        <div className="py-0.5">
          <TwoStageMultiSelect
            size="small"
            items={availableSeries.map((item) => ({ value: item.value, content: item.content as string }))}
            selectedItems={value.map((s) => ({
              value: s.id,
              content: { value: s.name, modifier: s.sequence || '' }
            }))}
            onItemAdded={(item) => {
              const newSeries: Series = { id: item.value, name: item.content.value, sequence: item.content.modifier }
              onChange([...value, newSeries])
            }}
            onItemRemoved={(item) => {
              onChange(value.filter((s) => s.id !== item.value))
            }}
            onItemEdited={(item, index) => {
              const editedSeries: Series = { id: item.value, name: item.content.value, sequence: item.content.modifier }
              const newSeriesList = [...value]
              newSeriesList[index] = editedSeries
              onChange(newSeriesList)
            }}
            autoFocus
          />
        </div>
      )}
    />
  )
}
