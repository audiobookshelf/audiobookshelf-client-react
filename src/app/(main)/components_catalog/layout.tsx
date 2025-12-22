import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { ComponentsCatalogProvider } from '../../../contexts/ComponentsCatalogContext'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf - Components Catalog',
  description: 'Components catalog for audiobookshelf client'
}

export default async function ComponentsCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser] = await getData(getCurrentUser())
  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  return (
    <>
      <AppBar user={currentUser.user} />
      <ComponentsCatalogProvider currentUser={currentUser}>
        <div className="w-full h-full max-h-screen overflow-x-hidden overflow-y-auto">{children}</div>
      </ComponentsCatalogProvider>
    </>
  )
}
