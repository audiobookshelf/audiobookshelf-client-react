import Link from 'next/link'
import LibrariesDropdown from './LibrariesDropdown'
import Btn from '@/components/ui/Btn'
import GlobalSearchInput from './GlobalSearchInput'

export default async function AppBar(props: { libraries?: any; currentLibraryId?: string; user: any }) {
  return (
    <div className="w-full h-16 bg-primary flex items-center justify-start px-2 md:px-6 gap-4 shadow-xl">
      <Link href={'/'} title="Home" className="text-sm text-foreground hover:text-foreground/80">
        <img src="/icon.svg" alt="audiobookshelf" className="w-8 min-w-8 h-8 sm:w-10 sm:min-w-10 sm:h-10" />
      </Link>
      <Link href={'/'} title="Home" className="text-sm text-foreground hover:text-foreground/80">
        <h1 className="text-xl hidden lg:block hover:underline">audiobookshelf</h1>
      </Link>
      {props.libraries && props.currentLibraryId && <LibrariesDropdown currentLibraryId={props.currentLibraryId} libraries={props.libraries} />}
      <GlobalSearchInput />
      <div className="flex-grow" />
      <div className="flex items-center gap-4">
        <Link href="/components_catalog" title="Components Catalog" className="text-sm text-foreground hover:text-foreground/80">
          <span className="material-symbols text-xl">widgets</span>
        </Link>
        {['admin', 'root'].includes(props.user.type) && (
          <Link href="/settings" title="Settings" className="text-sm text-foreground hover:text-foreground/80">
            <span className="material-symbols text-xl">settings</span>
          </Link>
        )}
        <Btn to="/account" className="pl-3 pr-2 w-32 justify-between">
          <span className="text-sm">{props.user.username}</span>
          <span className="material-symbols text-xl">person</span>
        </Btn>
      </div>
    </div>
  )
}
