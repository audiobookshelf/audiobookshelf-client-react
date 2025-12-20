import { SettingsDrawerProvider } from '@/contexts/SettingsDrawerContext'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'
import SettingsLayoutWrapper from './SettingsLayoutWrapper'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser] = await getData(getCurrentUser())
  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  // Redirect to library page if user is not admin or root
  if (!['admin', 'root'].includes(currentUser.user.type)) {
    return redirect('/library')
  }

  return (
    <SettingsDrawerProvider>
      <AppBar user={currentUser.user} />
      <SettingsLayoutWrapper currentUser={currentUser}>{children}</SettingsLayoutWrapper>
    </SettingsDrawerProvider>
  )
}
