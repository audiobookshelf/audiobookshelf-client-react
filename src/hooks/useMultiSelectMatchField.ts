import { MultiSelectItem } from '@/components/ui/MultiSelect'
import { useCallback, useMemo } from 'react'

/**
 * Generic hook for managing multi-select fields in match views
 * Handles the selected items state and provides add/remove/replace operations
 */
export function useMultiSelectMatchField<T>(match: T | undefined, field: keyof T, setMatch: React.Dispatch<React.SetStateAction<T>>) {
  const selectedItems = useMemo(() => {
    const value = match?.[field]
    if (!value) return []
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string').map((v) => ({ value: v, content: v }))
    }
    return typeof value === 'string' ? [{ value, content: value }] : []
  }, [match, field])

  const handleAdd = useCallback(
    (item: MultiSelectItem<string>) => {
      setMatch((prev) => {
        const current = prev?.[field]
        const items = Array.isArray(current) ? current.filter((v): v is string => typeof v === 'string') : typeof current === 'string' ? [current] : []
        return { ...prev, [field]: [...items, item.content] as T[keyof T] }
      })
    },
    [field, setMatch]
  )

  const handleRemove = useCallback(
    (item: MultiSelectItem<string>) => {
      setMatch((prev) => {
        const current = prev?.[field]
        const items = Array.isArray(current) ? current.filter((v): v is string => typeof v === 'string') : typeof current === 'string' ? [current] : []
        return { ...prev, [field]: items.filter((v) => v !== item.value) as T[keyof T] }
      })
    },
    [field, setMatch]
  )

  const handleReplaceAll = useCallback(
    (items: string[]) => {
      setMatch((prev) => ({ ...prev, [field]: items as T[keyof T] }))
    },
    [field, setMatch]
  )

  return { selectedItems, handleAdd, handleRemove, handleReplaceAll }
}
