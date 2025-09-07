import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import AppBar from '../AppBar'
import SideNav from './SideNav'
import { getCurrentUser } from '../../../lib/api'

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

  return (
    <>
      <AppBar user={userResponse.data.user} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <SideNav />
        <div className="flex-1 min-w-0 page-bg-gradient">
          <div className="w-full h-[calc(100%-4rem)] overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  )
}
