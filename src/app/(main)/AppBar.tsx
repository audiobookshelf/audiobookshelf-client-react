import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import { getCurrentUser } from '../../lib/api'
import LibrariesDropdown from './LibrariesDropdown'

export default async function AppBar(props: { libraries?: any; currentLibraryId?: string }) {
  const userResponse = await getCurrentUser()

  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse)
    redirect(`/login`)
  }

  const user = userResponse.data?.user

  return (
    <div className="w-full h-16 bg-primary flex items-center justify-start px-4 gap-4">
      <Link href={'/'} title="Home" className="text-sm text-foreground hover:text-foreground/80">
        <h1 className="text-2xl font-bold">audiobookshelf</h1>
      </Link>
      {props.libraries && props.currentLibraryId && <LibrariesDropdown currentLibraryId={props.currentLibraryId} libraries={props.libraries} />}
      <div className="flex-grow" />
      <div className="flex items-center gap-4">
        <Link href="/components_catalog" title="Components Catalog" className="text-sm text-foreground hover:text-foreground/80">
          <span className="material-symbols text-xl">widgets</span>
        </Link>
        <p className="text-sm text-foreground">Logged in as {user.username}</p>
        <Link href="/settings" title="Settings" className="text-sm text-foreground hover:text-foreground/80">
          <span className="material-symbols text-xl">settings</span>
        </Link>
        <LogoutButton />
      </div>
    </div>
  )
}
