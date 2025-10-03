'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useRef, useState } from 'react'
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
  onItemEditSaveClick: (item: EditListItem, newValue: string) => Promise<any>
  onItemDeleteClick: (item: EditListItem) => Promise<any>
  libraryId?: string
}

export default function EditList({ items, onItemEditSaveClick, onItemDeleteClick, libraryId }: EditListProps) {
  const t = useTypeSafeTranslations() //TODO
  const [itemList, setItemList] = useState(items)
  const [editedItem, setEditedItem] = useState<EditListItem>({ id: '', value: '' })
  const [newValue, setNewValue] = useState('')
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const delRef = useRef<EditListItem>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const showNumBooks = items.some((item) => {
    return item.numBooks && item.numBooks > 0
  })

  // Switch to edit mode for a row
  const handleEditItemClick = (clickedItem: EditListItem) => {
    setEditedItem(clickedItem)
    setNewValue(clickedItem.value)
  }

  // Delete a row
  const handleDeleteClick = (clickedItem: EditListItem) => {
    delRef.current = clickedItem
    setIsDeleting(true)
    setIsProcessingModalOpen(true)
  }

  const handleDeleteModalClick = async () => {
    if (!delRef.current) return
    setIsProcessing(true)
    await onItemDeleteClick(delRef.current)
      .then(() => {
        setItemList(
          itemList.filter((item) => {
            return item.id !== delRef.current?.id
          })
        )
      })
      .finally(() => {
        setIsProcessing(false)
        setIsProcessingModalOpen(false)
      })
  }

  // Cancel editing a row and return to initial state/value
  const handleCancelEditClick = () => {
    delRef.current = null
    setIsProcessingModalOpen(false)
    setEditedItem({ id: '', value: '' })
  }

  // Save an edited row
  const handleSaveEditClick = (clickedItem: EditListItem) => {
    setEditedItem(clickedItem)
    setIsDeleting(false)
    setIsProcessingModalOpen(true)
  }

  const handleSaveModalClick = async () => {
    setIsProcessing(true)
    await onItemEditSaveClick(editedItem, newValue)
      .then((updatedItemList) => {
        setItemList(updatedItemList)
      })
      .finally(() => {
        setIsProcessing(false)
        setIsProcessingModalOpen(false)
      })
  }

  return (
    <div role="list" className={mergeClasses('border border-white/10 max-w-2xl mx-auto')}>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="text-left py-2 px-3" title="Name">
              Name
            </th>
            {showNumBooks && <th>Books</th>}
          </tr>
        </thead>
        <tbody>
          {itemList.map((item, idx) => (
            <tr
              key={item.id}
              className={mergeClasses('w-full p-2 group', {
                'bg-primary/20': idx % 2 === 0
              })}
            >
              {item !== editedItem && (
                <>
                  <td className={mergeClasses('p-3')}>
                    <a
                      className={mergeClasses('text-sm md:text-base text-gray-100 truncate')}
                      title={item.value}
                      // Only narrators can be clicked on, tags/genres don't have library info attached.
                      // href could be made an EditListItem prop that is passed in if other pages start using this
                      href={libraryId ? `/library/${libraryId}/bookshelf??filter=narrators.${item.id}` : undefined}
                    >
                      {item.value}
                    </a>
                  </td>
                  {showNumBooks && (
                    <td className="w-1/6">
                      <div className="flex justify-center">
                        <a
                          className={mergeClasses('text-sm md:text-base hover:underline')}
                          href={libraryId ? `/library/${libraryId}/bookshelf??filter=narrators.${item.id}` : undefined}
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
                        ariaLabel="Edit"
                      >
                        Edit
                      </IconBtn>
                      <IconBtn
                        size="small"
                        borderless={true}
                        onClick={() => handleDeleteClick(item)}
                        className={mergeClasses('text-gray-400 group-hover:text-white')}
                        ariaLabel="Delete"
                      >
                        Delete
                      </IconBtn>
                    </div>
                  </td>
                </>
              )}
              {item === editedItem && (
                <>
                  <td className="p3">
                    <TextInput value={newValue} onChange={setNewValue} className="m-1 pe-5"></TextInput>
                  </td>
                  {showNumBooks && (
                    <td className="w-1/6">
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
                        disabled={item.value === newValue}
                        onClick={() => handleSaveEditClick(item)}
                        ariaLabel="Save"
                      >
                        Save
                      </Btn>
                      <Btn size="small" className="mx-1" onClick={() => handleCancelEditClick()} ariaLabel="Cancel">
                        Cancel
                      </Btn>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <Modal isOpen={isProcessingModalOpen} onClose={() => setIsProcessingModalOpen(false)} processing={isProcessing} width={500}>
        <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
          {isDeleting ? (
            <p className="text-gray-300 mb-6 flex-1">Are you sure you want to remove &quot;{delRef.current?.value}&quot; from all items?</p>
          ) : (
            <p className="text-gray-300 mb-6 flex-1">
              Are you sure you want to rename &quot;{editedItem.value}&quot; to &quot;{newValue}&quot; for all items?
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Btn onClick={isDeleting ? handleDeleteModalClick : handleSaveModalClick} color="bg-success" disabled={isProcessing}>
              Yes
            </Btn>
            <Btn onClick={handleCancelEditClick} disabled={isProcessing}>
              Cancel
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
