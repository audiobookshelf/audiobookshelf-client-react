import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser, getLibraries } from '../../../../lib/api'
import '../../../../assets/globals.css'
import LogoutButton from '../../LogoutButton'
import LibrariesDropdown from './LibrariesDropdown'

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
    <html lang="en">
      <body>
        <div className="w-full h-16 bg-primary flex items-center justify-start px-4 gap-4">
          <h1 className="text-2xl font-bold">audiobookshelf</h1>
          <LibrariesDropdown currentLibraryId={currentLibraryId} libraries={libraries} />
          <div className="flex-grow" />
          <div className="flex items-center gap-4">
            <p className="text-sm text-foreground">Logged in as {user.username}</p>
            <LogoutButton />
          </div>
        </div>
        <div>{children}</div>
      </body>
    </html>
  )
}
