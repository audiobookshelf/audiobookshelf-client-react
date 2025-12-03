'use client'

import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useMemo } from 'react'

export interface MediaCardMoreMenuSubitem {
  text: string
  func: string
  data?: Record<string, string>
}

export interface MediaCardMoreMenuItem {
  text: string
  func?: string
  subitems?: MediaCardMoreMenuSubitem[]
}

interface MediaCardMoreMenuProps {
  items: MediaCardMoreMenuItem[]
  processing?: boolean
  onAction: (func: string, data?: Record<string, string>) => void
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export default function MediaCardMoreMenu({ items, processing = false, onAction, onOpenChange, className }: MediaCardMoreMenuProps) {
  const contextMenuItems = useMemo<ContextMenuDropdownItem<string>[]>(() => {
    return items.map((item) => ({
      text: item.text,
      action: item.func ?? '',
      subitems: item.subitems?.map((subitem) => ({
        text: subitem.text,
        action: subitem.func,
        data: subitem.data ?? {}
      }))
    }))
  }, [items])

  const handleContextMenuAction = useCallback(
    ({ action, data }: { action: string; data?: Record<string, string> }) => {
      if (!action) return
      onAction(action, data)
    },
    [onAction]
  )

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onOpenChange?.(isOpen)
    },
    [onOpenChange]
  )

  if (!contextMenuItems.length) {
    return null
  }

  return (
    <ContextMenuDropdown
      items={contextMenuItems}
      borderless
      size="small"
      menuAlign="right"
      autoWidth
      processing={processing}
      onAction={handleContextMenuAction}
      onOpenChange={handleOpenChange}
      className={mergeClasses('w-auto h-auto text-[1em]', className)}
      usePortal
    />
  )
}
