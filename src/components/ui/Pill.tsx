import React from 'react'
import { mergeClasses } from '@/lib/merge-classes'
import { MultiSelectItem } from './MultiSelect'

interface PillProps {
  item: MultiSelectItem
  id: string
  isFocused: boolean
  disabled: boolean
  showEdit: boolean
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void
  onEdit?: (item: string) => void
  onRemove: (item: MultiSelectItem) => void
}

export const Pill: React.FC<PillProps> = ({ item, id, isFocused, disabled, showEdit, onClick, onEdit, onRemove }) => {
  return (
    <div
      id={id}
      role="listitem"
      className={mergeClasses(
        'rounded-full px-2 py-1 mx-0.5 my-0.5 text-xs bg-bg flex flex-nowrap break-all items-center justify-center relative',
        !disabled && isFocused ? 'ring z-10' : ''
      )}
      style={{ minWidth: showEdit ? 44 : 22 }}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {!disabled && (
        <div
          className={mergeClasses('w-full h-full rounded-full absolute top-0 left-0 px-1 bg-bg/75 flex items-center justify-end opacity-0 hover:opacity-100')}
        >
          {showEdit && (
            <button
              type="button"
              aria-label="Edit"
              className="material-symbols text-white hover:text-warning cursor-pointer"
              style={{ fontSize: '1.1rem' }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault()
                onEdit?.(item.value)
              }}
              tabIndex={-1}
            >
              edit
            </button>
          )}
          <button
            type="button"
            aria-label="Remove"
            className="material-symbols text-white hover:text-error focus:text-error cursor-pointer"
            style={{ fontSize: '1.1rem' }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item)
            }}
            tabIndex={-1}
          >
            close
          </button>
        </div>
      )}
      {item.text}
    </div>
  )
}

export default Pill
