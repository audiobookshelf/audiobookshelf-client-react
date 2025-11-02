import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import LibraryIcon from '@/components/ui/LibraryIcon'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import Link from 'next/link'

interface LibrariesListRowProps {
  item: Library
}

export default function LibrariesListRow({ item }: LibrariesListRowProps) {
  const t = useTypeSafeTranslations()

  const contextMenuItems: ContextMenuDropdownItem[] = [
    { text: t('ButtonEdit'), action: 'edit' },
    { text: t('ButtonScan'), action: 'scan' },
    { text: t('ButtonDelete'), action: 'delete' }
  ]

  if (item.mediaType === 'book') {
    contextMenuItems.splice(2, 0, { text: t('ButtonMatchBooks'), action: 'matchBooks' })
  }

  return (
    <div className="flex items-center gap-4 py-1 px-4 hover:bg-primary/20 text-foreground/50 hover:text-foreground">
      <LibraryIcon icon={item.icon} />
      <Link className="text-foreground hover:underline" href={`/library/${item.id}`}>
        {item.name}
      </Link>
      <div className="grow" />
      <Btn color="bg-bg" className="h-auto px-3 text-xs" size="small" onClick={() => {}}>
        {t('ButtonScan')}
      </Btn>
      <ContextMenuDropdown borderless size="small" items={contextMenuItems} />
      <div className="drag-handle cursor-n-resize">
        <span className="material-symbols text-xl text-foreground/50 hover:text-foreground">reorder</span>
      </div>
    </div>
  )
}
