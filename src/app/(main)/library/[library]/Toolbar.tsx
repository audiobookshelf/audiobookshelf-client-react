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
      {/* hacky way to cover the shadow of the side rail. not sure of a better way to handle this. */}
      <div className="absolute top-0 start-0 h-full w-4 pointer-events-none bg-bg z-10" />

      <div className="w-full h-full flex items-center justify-between px-4">
        {isBookshelf && (
          <p className="text-sm text-white">
            {itemCount} {itemName}
          </p>
        )}

        <div className="flex-grow" />

        <ContextMenuDropdown items={contextMenuItems} borderless onAction={(action) => console.log(action)} />
      </div>
    </div>
  )
}
