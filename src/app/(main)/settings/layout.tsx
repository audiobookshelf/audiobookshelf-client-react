import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser } from '../../../lib/api'
import AppBar from '../AppBar'
import SideNav from './SideNav'

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

  const installSource = userResponse.data?.Source || 'Unknown'
  const serverVersion = userResponse.data?.serverSettings?.version || 'Error'

  return (
    <>
      <AppBar user={userResponse.data.user} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <SideNav serverVersion={serverVersion} installSource={installSource} />
        <div className="flex-1 min-w-0 page-bg-gradient">
          <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  )
}
