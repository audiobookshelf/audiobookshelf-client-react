import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import AppBar from '../AppBar'
import { getCurrentUser, getData } from '../../../lib/api'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [userResponse] = await getData(getCurrentUser())
  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse)
    redirect(`/login`)
  }

  return (
    <>
      <AppBar user={userResponse.data.user} />
      <div className="page-bg-gradient h-[calc(100vh-4rem)]">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
