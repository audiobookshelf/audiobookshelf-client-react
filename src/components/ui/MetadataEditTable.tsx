'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { TranslationKey } from '@/types/translations'
import { Fragment, useEffect, useRef, useState, useTransition } from 'react'
import ConfirmDialog from '../widgets/ConfirmDialog'
import Btn from './Btn'
import IconBtn from './IconBtn'
import SimpleDataTable, { DataTableColumn } from './SimpleDataTable'
import TextInput from './TextInput'

type MetadataListType = 'Tag' | 'Genre' | 'Narrator'

export interface MetadataEditTableItem {
  id: string
  name: string
  numBooks?: number
}

interface MetadataEditTableProps {
  items: MetadataEditTableItem[]
  onItemEditSaveClick: (item: MetadataEditTableItem, newName: string) => Promise<void>
  onItemDeleteClick: (item: MetadataEditTableItem) => Promise<void>
  listType: MetadataListType
  libraryId?: string
}

interface ListTypeStrings {
  rename: TranslationKey
  remove: TranslationKey
  mergeNote: TranslationKey
  warning: TranslationKey
  empty: TranslationKey
}

const LIST_TYPE_STRINGS: Record<MetadataListType, ListTypeStrings> = {
  Tag: {
    rename: 'MessageConfirmRenameTag',
    remove: 'MessageConfirmRemoveTag',
    mergeNote: 'MessageConfirmRenameTagMergeNote',
    warning: 'MessageConfirmRenameTagWarning',
    empty: 'MessageListEmptyTag'
  },
  Genre: {
    rename: 'MessageConfirmRenameGenre',
    remove: 'MessageConfirmRemoveGenre',
    mergeNote: 'MessageConfirmRenameGenreMergeNote',
    warning: 'MessageConfirmRenameGenreWarning',
    empty: 'MessageListEmptyGenre'
  },
  Narrator: {
    rename: 'MessageConfirmRenameNarrator',
    remove: 'MessageConfirmRemoveNarrator',
    mergeNote: 'MessageConfirmRenameNarratorMergeNote',
    warning: 'MessageConfirmRenameNarratorWarning',
    empty: 'MessageListEmptyNarrator'
  }
}

export default function MetadataEditTable({ items, onItemEditSaveClick, onItemDeleteClick, listType, libraryId }: MetadataEditTableProps) {
  const t = useTypeSafeTranslations()
  const strings = LIST_TYPE_STRINGS[listType]
  const showNumBooks = listType === 'Narrator'

  const [editedItem, setEditedItem] = useState<MetadataEditTableItem | null>(null)
  const [newName, setNewName] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasSameName, setHasSameName] = useState(false)
  const [sameNameWithDifferentCase, setSameNameWithDifferentCase] = useState('')
  const [isPending, startTransition] = useTransition()
  const delRef = useRef<MetadataEditTableItem | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Focus the input when a row switches into edit mode
  useEffect(() => {
    if (editedItem) {
      editInputRef.current?.focus()
    }
  }, [editedItem])

  // Switch a row into edit mode
  const startEdit = (item: MetadataEditTableItem) => {
    setEditedItem(item)
    setNewName(item.name)
  }

  // Cancel editing and reset back to the initial state
  const cancelEdit = () => {
    delRef.current = null
    setShowConfirmDialog(false)
    setEditedItem(null)
    setNewName('')
    setHasSameName(false)
    setSameNameWithDifferentCase('')
    setIsDeleting(false)
  }

  // Open the confirm dialog for a delete
  const requestDelete = (item: MetadataEditTableItem) => {
    delRef.current = item
    setIsDeleting(true)
    setShowConfirmDialog(true)
  }

  // Open the confirm dialog for a rename, computing merge/case warnings
  const requestSave = (item: MetadataEditTableItem) => {
    setEditedItem(item)
    const mergesWithExisting = items.some((existing) => existing.name === newName.trim())
    const caseConflict = mergesWithExisting ? null : items.find((existing) => existing.id !== item.id && existing.name.toLowerCase() === newName.toLowerCase())
    setHasSameName(mergesWithExisting)
    setSameNameWithDifferentCase(caseConflict?.name ?? '')
    setIsDeleting(false)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    const itemToDelete = delRef.current
    if (!itemToDelete || isPending) return

    startTransition(async () => {
      try {
        await onItemDeleteClick(itemToDelete)
      } catch (error) {
        console.error('MetadataTable: Error deleting item:', error)
      } finally {
        delRef.current = null
        setShowConfirmDialog(false)
      }
    })
  }

  const confirmSave = () => {
    const itemToSave = editedItem
    if (!itemToSave || isPending) return

    startTransition(async () => {
      try {
        await onItemEditSaveClick(itemToSave, newName)
      } catch (error) {
        console.error('MetadataTable: Error saving edited item:', error)
      } finally {
        setShowConfirmDialog(false)
      }
    })
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (editedItem && editedItem.name !== newName && newName.trim() !== '') {
        requestSave(editedItem)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditedItem(null)
    }
  }

  // Only narrators are clickable; tags/genres have no library info attached.
  // href could be made an item prop if other pages start using this table.
  const narratorHref = (item: MetadataEditTableItem) => `/library/${libraryId}/items?filter=narrators.${item.id}`

  const renderDisplayRow = (item: MetadataEditTableItem) => (
    <tr className="group even:bg-primary/20 p-2">
      <td className="p-3.5">
        {showNumBooks ? (
          <a className="text-foreground text-sm hover:underline md:text-base" title={item.name} href={narratorHref(item)}>
            {item.name}
          </a>
        ) : (
          <span className="text-foreground text-sm md:text-base" title={item.name}>
            {item.name}
          </span>
        )}
      </td>
      {showNumBooks && (
        <td className="hidden w-1/6 md:table-cell">
          <div className="flex justify-center">
            <a className="text-foreground text-sm hover:underline md:text-base" href={narratorHref(item)}>
              {item.numBooks}
            </a>
          </div>
        </td>
      )}
      <td className="w-1/4">
        <div className="flex justify-end pe-2">
          <IconBtn
            size="small"
            borderless
            onClick={() => startEdit(item)}
            className="text-foreground-muted group-hover:text-foreground"
            ariaLabel={t('ButtonEdit')}
          >
            {t('ButtonEdit')}
          </IconBtn>
          <IconBtn
            size="small"
            borderless
            onClick={() => requestDelete(item)}
            className="text-foreground-muted group-hover:text-foreground"
            ariaLabel={t('ButtonDelete')}
          >
            {t('ButtonDelete')}
          </IconBtn>
        </div>
      </td>
    </tr>
  )

  const renderEditRow = (item: MetadataEditTableItem) => {
    const trimmedName = newName.trim()
    return (
      <tr className="group even:bg-primary/20 p-2">
        <td className="p-0.5 text-base">
          <TextInput value={newName} onChange={setNewName} onKeyDown={handleInputKeyDown} ref={editInputRef} className="m-1 pe-5" />
        </td>
        {showNumBooks && (
          <td className="hidden w-1/6 md:table-cell">
            <div className="flex justify-center">
              <a className="text-sm hover:underline md:text-base">{item.numBooks}</a>
            </div>
          </td>
        )}
        <td className="w-1/4">
          <div className="mx-1 flex justify-end">
            <Btn
              color="bg-success"
              size="small"
              className="mx-1"
              disabled={item.name === trimmedName || trimmedName === ''}
              onClick={() => requestSave(item)}
              ariaLabel="Save"
            >
              {t('ButtonSave')}
            </Btn>
            <Btn size="small" className="mx-1" onClick={cancelEdit} ariaLabel="Cancel">
              {t('ButtonCancel')}
            </Btn>
          </div>
        </td>
      </tr>
    )
  }

  const columns: DataTableColumn<MetadataEditTableItem>[] = [
    { label: t('LabelName') },
    ...(showNumBooks ? [{ label: t('LabelBooks'), headerClassName: 'text-center hidden md:table-cell' }] : []),
    { label: '' }
  ]

  // Empty state message
  if (!items.length) {
    return <p className="text-foreground py-10 text-center text-xl">{t(strings.empty)}</p>
  }

  return (
    <>
      <SimpleDataTable
        data={items}
        columns={columns}
        getRowKey={(item) => item.id}
        renderRow={(item) => <Fragment key={item.id}>{item === editedItem ? renderEditRow(item) : renderDisplayRow(item)}</Fragment>}
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={
          isDeleting ? (
            t(strings.remove, { 0: delRef.current?.name || '' })
          ) : (
            <>
              <p className="text-foreground mb-6 flex-1">{t(strings.rename, { 0: editedItem?.name ?? '', 1: newName })}</p>
              {/* Show a warning if the new value already exists or only differs by case */}
              {hasSameName && <p className="mb-6 flex-1 text-yellow-500">{t(strings.mergeNote)}</p>}
              {sameNameWithDifferentCase !== '' && <p className="mb-6 flex-1 text-yellow-500">{t(strings.warning, { 0: sameNameWithDifferentCase })}</p>}
            </>
          )
        }
        yesButtonText={isDeleting ? t('ButtonDelete') : t('ButtonSave')}
        yesButtonClassName={isDeleting ? 'bg-error' : 'bg-success'}
        processing={isPending}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={isDeleting ? confirmDelete : confirmSave}
      />
    </>
  )
}
