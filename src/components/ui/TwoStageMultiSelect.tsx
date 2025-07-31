import React, { useCallback, useEffect, useState } from 'react'
import MultiSelect, { MultiSelectProps, type MultiSelectItem } from './MultiSelect'
import { useGlobalToast } from '@/contexts/ToastContext'

type TwoStageMultiSelectProps = Omit<MultiSelectProps, 'showEdit' | 'showInput' | 'allowNew' | 'editingPillIndex' | 'onEditingPillIndexChange'> & {
  delimiter?: string
}

export const TwoStageMultiSelect: React.FC<TwoStageMultiSelectProps> = ({
  selectedItems,
  items,
  label,
  delimiter = ' #',
  onItemAdded,
  onItemRemoved,
  onItemEdited,
  ...rest
}) => {
  const { showToast } = useGlobalToast()
  const [editingPillIndex, setEditingPillIndex] = useState<number | null>(null)
  const [inStage2, setInStage2] = useState(false)
  const [selectedItemsInternal, setSelectedItemsInternal] = useState<MultiSelectItem[]>(selectedItems)

  useEffect(() => {
    if (!inStage2) {
      setSelectedItemsInternal(selectedItems)
    }
  }, [selectedItems, inStage2])

  const matchItem = useCallback(
    (text: string, skipIndex: number = -1) => {
      const [input1, input2] = text.split(delimiter)
      const fromItems = items.find((i) => i.text.toLowerCase() === input1.toLowerCase())

      const matchedValue = fromItems ? fromItems.value : 'new-' + input1
      const isAlreadySelected = selectedItems.some((i, index) => i.value === matchedValue && index !== skipIndex)

      if (isAlreadySelected) {
        showToast(`Item ${input1} already selected`, { type: 'warning', title: 'Item already selected' })
        return null
      }

      const matchedText = fromItems ? fromItems.text : input1
      return { value: matchedValue, text: `${matchedText}${input2 ? `${delimiter}${input2}` : ''}` }
    },
    [items, delimiter, selectedItems, showToast]
  )

  const handleItemAdded = useCallback(
    (item: MultiSelectItem) => {
      const newItem = matchItem(item.text)
      if (!newItem) return

      if (item.text.includes(delimiter)) {
        onItemAdded?.(newItem)
        setInStage2(false)
      } else {
        const itemForStage2 = { value: newItem.value, text: `${newItem.text}${delimiter}` }
        setSelectedItemsInternal([...selectedItemsInternal, itemForStage2])
        setEditingPillIndex(selectedItemsInternal.length)
        setInStage2(true)
      }
    },
    [delimiter, onItemAdded, matchItem, selectedItemsInternal]
  )

  const handleItemRemoved = useCallback(
    (item: MultiSelectItem) => {
      onItemRemoved?.(item)
      setInStage2(false)
    },
    [onItemRemoved]
  )

  const handleItemEdited = useCallback(
    (item: MultiSelectItem, index: number) => {
      if (item.text.includes(delimiter)) {
        const newItem = matchItem(item.text, inStage2 ? -1 : index)
        if (newItem) {
          if (inStage2) {
            onItemAdded?.(newItem)
          } else {
            onItemEdited?.(newItem, index)
          }
        }
      } else {
        onItemEdited?.(item, index)
      }
      setInStage2(false)
    },
    [onItemEdited, onItemAdded, inStage2, matchItem, delimiter]
  )

  const handleEditingPillIndexChange = useCallback((index: number | null) => {
    setEditingPillIndex(index)
    setInStage2(false)
  }, [])

  return (
    <MultiSelect
      selectedItems={selectedItemsInternal}
      items={items}
      onItemAdded={handleItemAdded}
      onItemRemoved={handleItemRemoved}
      onItemEdited={handleItemEdited}
      label={label}
      showEdit={true}
      editingPillIndex={editingPillIndex}
      onEditingPillIndexChange={handleEditingPillIndexChange}
      allowNew={true}
      showInput={true}
      {...rest}
    />
  )
}

export default TwoStageMultiSelect
