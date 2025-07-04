import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../../lib/api'
import '../../../assets/globals.css'
import LogoutButton from '../LogoutButton'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userResponse = await getCurrentUser()

  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse)
    redirect(`/login`)
  }

  const user = userResponse.data?.user

  return (
    <html lang="en">
      <body>
        <div className="w-full h-16 bg-primary flex items-center justify-start px-4 gap-4">
          <Link href={'/'} title="Home" className="text-sm text-foreground hover:text-foreground/80">
            <h1 className="text-2xl font-bold">audiobookshelf</h1>
          </Link>
          <div className="flex-grow" />
          <div className="flex items-center gap-4">
            <p className="text-sm text-foreground">Logged in as {user.username}</p>
            <Link href="/settings" title="Settings" className="text-sm text-foreground hover:text-foreground/80">
              <span className="material-symbols text-xl">settings</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
        <div>{children}</div>
      </body>
    </html>
  )
}
