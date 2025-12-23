import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function UploadLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  //TODO move to context provider
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  return (
    <>
      <AppBar user={currentUser.user} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden" draggable={false}>
        <div className="flex-1 min-w-0 page-bg-gradient">
          <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  )
}
