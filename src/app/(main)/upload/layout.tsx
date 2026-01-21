import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'
import UploadLayoutWrapper from './UploadLayoutWrapper'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function UploadLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  return (
    <>
      <AppBar currentUser={currentUser} />
      <UploadLayoutWrapper>{children}</UploadLayoutWrapper>
    </>
  )
}
