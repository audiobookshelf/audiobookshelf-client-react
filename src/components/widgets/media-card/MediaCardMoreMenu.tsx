'use client'

import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useMemo } from 'react'

/** Overlay buttons on the same card should not dismiss the menu before their click handlers run. */
function isOverlayActionInsideCard(target: Node, cardId: string): boolean {
  if (!(target instanceof Element)) return false
  return !!target.closest(`#${CSS.escape(cardId)} [data-overlay-action]`)
}

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

export function mapMediaCardMoreMenuItemsToDropdownItems(items: MediaCardMoreMenuItem[]): ContextMenuDropdownItem<string>[] {
  return items.map((item) => ({
    text: item.text,
    action: item.func ?? '',
    subitems: item.subitems?.map((subitem) => ({
      text: subitem.text,
      action: subitem.func,
      data: subitem.data ?? {}
    }))
  }))
}

interface MediaCardMoreMenuProps {
  items: MediaCardMoreMenuItem[]
  /** Matches MediaCardFrame root `id` so overlay clicks are scoped to this card only. */
  cardId: string
  processing?: boolean
  isOpen?: boolean
  onAction: (func: string, data?: Record<string, string>) => void
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export default function MediaCardMoreMenu({ items, cardId, processing = false, isOpen, onAction, onOpenChange, className }: MediaCardMoreMenuProps) {
  const contextMenuItems = useMemo(() => mapMediaCardMoreMenuItemsToDropdownItems(items), [items])
  const isAdditionalInside = useCallback((target: Node) => isOverlayActionInsideCard(target, cardId), [cardId])

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
      isOpen={isOpen}
      onAction={handleContextMenuAction}
      onOpenChange={handleOpenChange}
      isAdditionalInside={isAdditionalInside}
      className={mergeClasses('h-auto w-auto text-[1em] text-white', className)}
      usePortal
    />
  )
}
