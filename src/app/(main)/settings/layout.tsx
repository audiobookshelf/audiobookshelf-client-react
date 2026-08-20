import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { isUserAdminOrUp } from '@/lib/userPermissions'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBarLoader from '../AppBarLoader'
import SettingsLayoutWrapper from './SettingsLayoutWrapper'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleSettings'),
    description: 'Settings page for audiobookshelf client'
  }
}

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser] = await getData(getCurrentUser())
  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  // Redirect to library page if user is not admin or root
  if (!isUserAdminOrUp(currentUser.user.type)) {
    return redirect('/library')
  }

  return (
    <>
      <AppBarLoader />
      <SettingsLayoutWrapper>{children}</SettingsLayoutWrapper>
    </>
  )
}
