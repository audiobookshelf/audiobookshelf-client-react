import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'
import SideNav from './SideNav'
import SideNavMobileDrawer from './SideNavMobileDrawer'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [userResponse] = await getData(getCurrentUser())
  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse)
    redirect(`/login`)
  }

  // Redirect to library page if user is not admin or root
  if (!['admin', 'root'].includes(userResponse.data.user.type)) {
    return redirect('/library')
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
      <SideNavMobileDrawer serverVersion={serverVersion} installSource={installSource} />
    </>
  )
}
