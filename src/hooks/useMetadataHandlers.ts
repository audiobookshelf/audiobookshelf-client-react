import { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useCallback, useMemo } from 'react'

/**
 * Hook for handling simple string array metadata fields (e.g. Genres, Tags, Narrators)
 * for use with MultiSelect component.
 */
export function useSimpleMetadataHandlers(currentValues: string[] | undefined, updateFunc: (values: string[]) => void) {
  const items = useMemo(() => (currentValues || []).map((v) => ({ value: v, content: v })), [currentValues])

  const handleAdd = useCallback(
    (item: MultiSelectItem<string>) => {
      // Avoid duplicates if not already handled by logic, but usually Set is used or check existence
      // Here we assume simple append, parent often handles uniqueness or we use Set here
      const newValues = [...(currentValues || []), item.content]
      // dedupe just in case
      updateFunc([...new Set(newValues)])
    },
    [currentValues, updateFunc]
  )

  const handleRemove = useCallback(
    (item: MultiSelectItem<string>) => {
      updateFunc((currentValues || []).filter((v) => v !== item.value))
    },
    [currentValues, updateFunc]
  )

  return { items, handleAdd, handleRemove }
}
