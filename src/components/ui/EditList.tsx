'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../modals/Modal'
import Btn from './Btn'
import IconBtn from './IconBtn'
import TextInput from './TextInput'

interface EditListItem {
  id: string
  value: string
  numBooks?: number
}

interface EditListProps {
  items: EditListItem[]
  onItemEditSaveClick: (item: EditListItem, newValue: string) => Promise<void>
  onItemDeleteClick: (item: EditListItem) => Promise<void>
  listType: 'Tag' | 'Genre' | 'Narrator'
  libraryId?: string
}

export default function EditList({ items, onItemEditSaveClick, onItemDeleteClick, listType, libraryId }: EditListProps) {
  const t = useTypeSafeTranslations()
  const [editedItem, setEditedItem] = useState<EditListItem>({ id: '', value: '' })
  const [newValue, setNewValue] = useState('')
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const delRef = useRef<EditListItem>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasSameValue, setHasSameValue] = useState(false)
  const [sameValueWithDifferentCase, setSameValueWithDifferentCase] = useState('')
  const showNumBooks = items.some((item) => {
    return item.numBooks && item.numBooks > 0
  })

  // Switch to edit mode for a row
  const handleEditItemClick = (clickedItem: EditListItem) => {
    setEditedItem(clickedItem)
    setNewValue(clickedItem.value)
  }

  // focus on input when it appears
  useEffect(() => {
    if (editInputRef.current && editedItem.id !== '') {
      editInputRef.current.focus()
    }
  }, [editInputRef, editedItem])

  // Delete a row
  const handleDeleteClick = (clickedItem: EditListItem) => {
    delRef.current = clickedItem
    setIsDeleting(true)
    setIsProcessingModalOpen(true)
  }

  const handleDeleteModalClick = async () => {
    if (!delRef.current) return
    setIsProcessing(true)
    try {
      await onItemDeleteClick(delRef.current)
    } catch (error) {
      console.error('EditList: Error deleting item:', error)
    } finally {
      delRef.current = null
      setIsProcessing(false)
      setIsProcessingModalOpen(false)
    }
  }

  // Cancel editing a row and return to initial state/value
  const handleCancelEditClick = () => {
    delRef.current = null
    setIsProcessingModalOpen(false)
    setEditedItem({ id: '', value: '' })
    setHasSameValue(false)
    setSameValueWithDifferentCase('')
    setNewValue('')
    setIsDeleting(false)
  }

  // Save an edited row
  const handleSaveEditClick = useCallback(
    (clickedItem: EditListItem) => {
      setEditedItem(clickedItem)
      const hasSameValue = items.some((item) => item.value === newValue.trim())
      setHasSameValue(hasSameValue)
      const sameItemDifferentCase = !hasSameValue
        ? items.find((item) => item.id !== clickedItem.id && item.value.toLowerCase() === newValue.toLowerCase())
        : null
      setSameValueWithDifferentCase(sameItemDifferentCase?.value ?? '')
      setIsDeleting(false)
      setIsProcessingModalOpen(true)
    },
    [items, newValue]
  )

  const handleSaveModalClick = async () => {
    setIsProcessing(true)
    try {
      await onItemEditSaveClick(editedItem, newValue)
    } catch (error) {
      console.error('EditList: Error saving edited item:', error)
    } finally {
      setIsProcessing(false)
      setIsProcessingModalOpen(false)
    }
  }

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (editedItem?.value !== newValue && newValue.trim() !== '') {
          handleSaveEditClick(editedItem)
        }
      }
    },
    [editedItem, newValue, handleSaveEditClick]
  )

  const getListTypeEditString = useMemo(() => {
    switch (listType) {
      case 'Tag':
        return 'MessageConfirmRenameTag'
      case 'Genre':
        return 'MessageConfirmRenameGenre'
      case 'Narrator':
      default:
        return 'MessageConfirmRenameNarrator'
    }
  }, [listType])

  const getListTypeDeleteString = useMemo(() => {
    switch (listType) {
      case 'Tag':
        return 'MessageConfirmRemoveTag'
      case 'Genre':
        return 'MessageConfirmRemoveGenre'
      case 'Narrator':
      default:
        return 'MessageConfirmRemoveNarrator'
    }
  }, [listType])

  const getListTypeMergeString = useMemo(() => {
    switch (listType) {
      case 'Tag':
        return 'MessageConfirmRenameTagMergeNote'
      case 'Genre':
        return 'MessageConfirmRenameGenreMergeNote'
      case 'Narrator':
      default:
        return 'MessageConfirmRenameNarratorMergeNote'
    }
  }, [listType])

  const getListTypeWarningString = useMemo(() => {
    switch (listType) {
      case 'Tag':
        return 'MessageConfirmRenameTagWarning'
      case 'Genre':
        return 'MessageConfirmRenameGenreWarning'
      case 'Narrator':
      default:
        return 'MessageConfirmRenameNarratorWarning'
    }
  }, [listType])

  return (
    <div role="list" className={mergeClasses('border border-white/10 max-w-2xl mx-auto overflow-x-scroll')}>
      <table className="table-auto w-full">
        <thead className={mergeClasses('w-full bg-primary/50')}>
          <tr>
            <th className="text-left py-2 px-3" title="Name">
              {t('LabelName')}
            </th>
            {showNumBooks && <th className={mergeClasses('hidden md:table-cell')}>{t('LabelBooks')}</th>}
            {/* Empty header for action col to allow background to match with of rows correctly */}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <>
              {item !== editedItem && (
                <tr key={item.id} className={mergeClasses('p-2 group even:bg-primary/20')}>
                  <td className="p-3.5">
                    <a
                      className={mergeClasses('text-sm md:text-base text-gray-100')}
                      title={item.value}
                      // Only narrators can be clicked on, tags/genres don't have library info attached.
                      // href could be made an EditListItem prop that is passed in if other pages start using this
                      href={libraryId ? `/library/${libraryId}/bookshelf?filter=narrators.${item.id}` : undefined}
                    >
                      {item.value}
                    </a>
                  </td>
                  {showNumBooks && (
                    <td className={mergeClasses('hidden md:table-cell w-1/6')}>
                      <div className="flex justify-center">
                        <a
                          className={mergeClasses('text-sm md:text-base hover:underline')}
                          href={libraryId ? `/library/${libraryId}/bookshelf?filter=narrators.${item.id}` : undefined}
                        >
                          {item.numBooks}
                        </a>
                      </div>
                    </td>
                  )}
                  <td className="w-1/4 ">
                    <div className="flex justify-end">
                      <IconBtn
                        size="small"
                        borderless={true}
                        onClick={() => handleEditItemClick(item)}
                        className={mergeClasses('text-gray-400 group-hover:text-white')}
                        ariaLabel={t('ButtonEdit')}
                      >
                        {t('ButtonEdit')}
                      </IconBtn>
                      <IconBtn
                        size="small"
                        borderless={true}
                        onClick={() => handleDeleteClick(item)}
                        className={mergeClasses('text-gray-400 group-hover:text-white')}
                        ariaLabel={t('ButtonDelete')}
                      >
                        {t('ButtonDelete')}
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              )}
              {item === editedItem && (
                <tr key={item.id} className={mergeClasses('p-2 group even:bg-primary/20')}>
                  <td className="p-0.5">
                    <TextInput value={newValue} onChange={setNewValue} onKeyDown={handleInputKeyDown} ref={editInputRef} className="m-1 pe-5"></TextInput>
                  </td>
                  {showNumBooks && (
                    <td className={mergeClasses('hidden md:table-cell w-1/6')}>
                      <div className="flex justify-center">
                        <a className={mergeClasses('text-sm md:text-base hover:underline')}>{item.numBooks}</a>
                      </div>
                    </td>
                  )}
                  <td className="w-1/4">
                    <div className="flex mx-1">
                      <Btn
                        color="bg-success"
                        size="small"
                        className="mx-1"
                        disabled={item.value === newValue.trim() || newValue.trim() === ''}
                        onClick={() => handleSaveEditClick(item)}
                        ariaLabel="Save"
                      >
                        {t('ButtonSave')}
                      </Btn>
                      <Btn size="small" className="mx-1" onClick={() => handleCancelEditClick()} ariaLabel="Cancel">
                        {t('ButtonCancel')}
                      </Btn>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      <Modal isOpen={isProcessingModalOpen} onClose={() => setIsProcessingModalOpen(false)} processing={isProcessing} width={500}>
        <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
          {isDeleting ? (
            <p className="text-gray-300 mb-6 flex-1">{t(getListTypeDeleteString, [delRef.current?.value])}</p>
          ) : (
            <>
              <p className="text-gray-300 mb-6 flex-1">{t(getListTypeEditString, [editedItem.value, newValue])}</p>
              {/* Show warning if the new value already exists or has a different casing*/}
              {hasSameValue && <p className="text-yellow-500 mb-6 flex-1">{t(getListTypeMergeString)}</p>}
              {sameValueWithDifferentCase !== '' && <p className="text-yellow-500 mb-6 flex-1">{t(getListTypeWarningString, [sameValueWithDifferentCase])}</p>}
            </>
          )}
          <div className="flex justify-end gap-3">
            <Btn onClick={isDeleting ? handleDeleteModalClick : handleSaveModalClick} color="bg-success" disabled={isProcessing}>
              {t('ButtonYes')}
            </Btn>
            <Btn onClick={handleCancelEditClick} disabled={isProcessing}>
              {t('ButtonCancel')}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
