import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser, getLibraries } from '../../../../lib/api'
import '../../../../assets/globals.css'
import LogoutButton from '../../LogoutButton'
import LibrariesDropdown from './LibrariesDropdown'
import Link from 'next/link'
import { ToastProvider } from '../../../../contexts/ToastContext'
import GlobalToastContainer from '../../../../components/widgets/GlobalToastContainer'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function LibraryLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ library: string }>
}>) {
  const { library: currentLibraryId } = await params

  const [userResponse, librariesResponse] = await Promise.all([getCurrentUser(), getLibraries()])

  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse, librariesResponse)
    redirect(`/login`)
  }

  const user = userResponse.data?.user
  const libraries = librariesResponse.data?.libraries || []

  return (
    <>
      <ToastProvider>
        <div className="w-full h-16 bg-primary flex items-center justify-start px-4 gap-4">
          <Link href={'/'} title="Home" className="text-sm text-foreground hover:text-foreground/80">
            <h1 className="text-2xl font-bold">audiobookshelf</h1>
          </Link>
          <LibrariesDropdown currentLibraryId={currentLibraryId} libraries={libraries} />
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
        <div>{children}</div>
        <GlobalToastContainer />
      </ToastProvider>
    </>
  )
}
