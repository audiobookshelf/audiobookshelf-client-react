import Link from 'next/link'
import LibrariesDropdown from './LibrariesDropdown'
import Btn from '@/components/ui/Btn'
import GlobalSearchInput from './GlobalSearchInput'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'

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
      <div className="flex items-center">
        <Tooltip text="Components Catalog" position="bottom">
          <IconBtn borderless ariaLabel="Components Catalog" to="/components_catalog">
            widgets
          </IconBtn>
        </Tooltip>

        {['admin', 'root'].includes(props.user.type) && (
          <Tooltip text="Settings" position="bottom">
            <IconBtn borderless ariaLabel="Settings" to="/settings">
              settings
            </IconBtn>
          </Tooltip>
        )}

        <Tooltip text="Stats" position="bottom">
          <IconBtn borderless ariaLabel="Stats" to="/account/stats">
            equalizer
          </IconBtn>
        </Tooltip>
      </div>
      <Btn to="/account" className="ps-3 pe-2 w-32 justify-between">
        <span className="text-sm">{props.user.username}</span>
        <span className="material-symbols text-xl">person</span>
      </Btn>
    </div>
  )
}
