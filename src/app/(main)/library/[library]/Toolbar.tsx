'use client'

import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import { useLibrary } from '@/contexts/LibraryContext'
import { usePathname } from 'next/navigation'

export default function Toolbar() {
  const pathname = usePathname()
  const { library, itemCount, contextMenuItems, onContextMenuAction, toolbarExtras } = useLibrary()

  // Note: in the new router structure, /library/[id] renders LibraryPage (which is just a redirect or server fetcher)
  // The actual bookshelf is likely at /library/[id]/bookshelf for the client component.
  const isBookshelfPage = pathname.endsWith('/bookshelf')

  let itemName = 'items'
  if (library?.mediaType === 'podcast') {
    itemName = 'podcasts'
  } else if (library?.mediaType === 'book') {
    itemName = 'books'
  }

  const handleAction = (action: string) => {
    onContextMenuAction?.(action)
  }

  return (
    <div className="w-full h-10 bg-bg box-shadow-toolbar relative z-40" cy-id="library-toolbar">
      <div className="w-full h-full flex items-center justify-between px-4">
        {isBookshelfPage && (
          <p className="text-base text-foreground hidden md:block">
            {itemCount} {itemName}
          </p>
        )}

        <div className="flex-grow" />

        {isBookshelfPage && <div className="flex items-center gap-4 mr-2">{toolbarExtras}</div>}

        <ContextMenuDropdown items={contextMenuItems} borderless usePortal size="small" onAction={(args) => handleAction(args.action)} />
      </div>
    </div>
  )
}
