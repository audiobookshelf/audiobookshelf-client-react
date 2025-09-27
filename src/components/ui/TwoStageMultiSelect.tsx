'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { MultiSelect, type MultiSelectItem } from './MultiSelect'

export interface TwoStageMultiSelectContent {
  value: string
  modifier: string
}

interface TwoStageMultiSelectProps {
  // Core props
  selectedItems: MultiSelectItem<TwoStageMultiSelectContent>[]
  items: MultiSelectItem<string>[]
  label: string
  delimiter?: string

  // Event handlers
  onItemAdded?: (item: MultiSelectItem<TwoStageMultiSelectContent>) => void
  onItemRemoved?: (item: MultiSelectItem<TwoStageMultiSelectContent>) => void
  onItemEdited?: (item: MultiSelectItem<TwoStageMultiSelectContent>, index: number) => void

  // Validation
  onValidate?: (content: TwoStageMultiSelectContent) => string | null
  onValidationError?: (error: string) => void
  onDuplicateError?: (message: string) => void

  // Optional props
  disabled?: boolean
}

export const TwoStageMultiSelect: React.FC<TwoStageMultiSelectProps> = ({
  selectedItems: selectedItemsProp,
  items,
  label,
  delimiter = ' #',
  onItemAdded,
  onItemRemoved,
  onItemEdited,
  onValidate,
  onValidationError,
  onDuplicateError,
  disabled
}) => {
  const [editingPillIndex, setEditingPillIndex] = useState<number | null>(null)
  const [isEditingNewItem, setIsEditingNewItem] = useState(false)
  const [selectedItems, setSelectedItems] = useState<MultiSelectItem<TwoStageMultiSelectContent>[]>(selectedItemsProp)

  const onMutate = useCallback((prev: TwoStageMultiSelectContent | null, text: string): TwoStageMultiSelectContent => {
    if (prev) {
      // this is an existing item, so we need to update the text2
      return { value: prev.value, modifier: text }
    } else {
      // this is a new item, so we need to create a new item
      return { value: text, modifier: '' }
    }
  }, [])

  const getItemTextId = useCallback((item: TwoStageMultiSelectContent) => {
    return item.value
  }, [])

  const getEditableText = useCallback((item: TwoStageMultiSelectContent) => {
    return item.modifier
  }, [])

  const getReadOnlyPrefix = useCallback(
    (item: TwoStageMultiSelectContent) => {
      return `${item.value}${delimiter}`
    },
    [delimiter]
  )

  const getFullText = useCallback(
    (item: TwoStageMultiSelectContent) => {
      return `${item.value}${item.modifier ? delimiter + item.modifier : ''}`
    },
    [delimiter]
  )

  useEffect(() => {
    if (!isEditingNewItem) {
      setSelectedItems(selectedItemsProp)
    }
  }, [isEditingNewItem, selectedItemsProp])

  const handleItemAdded = useCallback(
    (item: MultiSelectItem<TwoStageMultiSelectContent>) => {
      item.content = { value: item.content.value, modifier: '' }
      setSelectedItems([...selectedItems, item])
      setEditingPillIndex(selectedItems.length)
      setIsEditingNewItem(true)
    },
    [selectedItems]
  )

  const handleItemRemoved = useCallback(
    (item: MultiSelectItem<TwoStageMultiSelectContent>) => {
      onItemRemoved?.(item)
      setIsEditingNewItem(false)
    },
    [onItemRemoved]
  )

  const handleItemEdited = useCallback(
    (item: MultiSelectItem<TwoStageMultiSelectContent>, index: number) => {
      if (isEditingNewItem) {
        onItemAdded?.(item)
      } else {
        onItemEdited?.(item, index)
      }
      setIsEditingNewItem(false)
    },
    [onItemEdited, onItemAdded, isEditingNewItem]
  )

  const handleEditingPillIndexChange = useCallback((index: number | null) => {
    setEditingPillIndex(index)
    setIsEditingNewItem(false)
  }, [])

  return (
    <MultiSelect
      selectedItems={selectedItems}
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
      disabled={disabled}
      onMutate={onMutate}
      onValidate={onValidate}
      onValidationError={onValidationError}
      onDuplicateError={onDuplicateError}
      getItemTextId={getItemTextId}
      getEditableText={getEditableText}
      getReadOnlyPrefix={getReadOnlyPrefix}
      getFullText={getFullText}
    />
  )
}

export default TwoStageMultiSelect
