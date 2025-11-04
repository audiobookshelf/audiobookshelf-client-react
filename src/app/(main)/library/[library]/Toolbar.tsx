'use client'

import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { useLibraryItems } from '@/contexts/LibraryItemsContext'
import { usePathname } from 'next/navigation'

interface ToolbarProps {
  currentLibrary?: {
    mediaType: string
  }
}

export default function Toolbar({ currentLibrary }: ToolbarProps) {
  const pathname = usePathname()
  const { itemCount } = useLibraryItems()

  const contextMenuItems: ContextMenuDropdownItem[] = [
    { text: 'Test 1', action: 'test1' },
    { text: 'Test 2', action: 'test2' }
  ]

  const lastPathSegment = pathname.split('/').pop()
  const isBookshelf = lastPathSegment === 'bookshelf'

  let itemName = 'items'
  if (currentLibrary?.mediaType === 'podcast') {
    itemName = 'podcasts'
  } else if (currentLibrary?.mediaType === 'book') {
    itemName = 'books'
  }

  return (
    <div className="w-full h-10 bg-bg box-shadow-toolbar relative">
      <div className="w-full h-full flex items-center justify-between px-4">
        {isBookshelf && (
          <p className="text-sm text-foreground">
            {itemCount} {itemName}
          </p>
        )}

        <div className="flex-grow" />

        <ContextMenuDropdown items={contextMenuItems} borderless onAction={(action) => console.log(action)} />
      </div>
    </div>
  )
}
