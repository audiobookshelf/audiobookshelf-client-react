import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser] = await getData(getCurrentUser())
  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  return (
    <>
      <AppBar user={currentUser.user} />
      <div className="page-bg-gradient h-[calc(100vh-4rem)]">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
