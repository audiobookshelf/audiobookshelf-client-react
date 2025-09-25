import LibraryIcon from '@/components/ui/LibraryIcon'
import Link from 'next/link'

export default function LibrariesListRow({ item }: { item: any }) {
  return (
    <div className="flex items-center gap-4 py-2 px-4 hover:bg-primary/20 text-white/50 hover:text-white">
      <LibraryIcon icon={item.icon} />
      <Link className="text-white hover:underline" href={`/library/${item.id}`}>
        {item.name as string}
      </Link>
      <div className="grow" />
      <div className="drag-handle cursor-n-resize">
        <span className="material-symbols text-xl text-white/50 hover:text-white">reorder</span>
      </div>
    </div>
  )
}
