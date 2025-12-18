'use client'

import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { usePathname } from 'next/navigation'

interface ToolbarProps {
  currentLibrary?: {
    mediaType: string
  }
}

export default function Toolbar({ currentLibrary }: ToolbarProps) {
  const pathname = usePathname()
  const { itemCount, contextMenuItems, onContextMenuAction } = useLibrary()

  const lastPathSegment = pathname.split('/').pop()
  const isBookshelf = lastPathSegment === 'bookshelf'

  let itemName = 'items'
  if (currentLibrary?.mediaType === 'podcast') {
    itemName = 'podcasts'
  } else if (currentLibrary?.mediaType === 'book') {
    itemName = 'books'
  }

  return (
    <div className="w-full h-10 bg-bg box-shadow-toolbar relative z-40" cy-id="library-toolbar">
      <div className="w-full h-full flex items-center justify-between px-4">
        {isBookshelf && (
          <p className="text-sm text-foreground">
            {itemCount} {itemName}
          </p>
        )}

        <div className="flex-grow" />

        <ContextMenuDropdown
          items={contextMenuItems}
          borderless
          usePortal
          onAction={(args) => {
            if (onContextMenuAction) onContextMenuAction(args.action)
          }}
        />
      </div>
    </div>
  )
}
