import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { ComponentsCatalogProvider } from '../../../contexts/ComponentsCatalogContext'
import { getCurrentUser, getData, getLibraries } from '../../../lib/api'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf - Components Catalog',
  description: 'Components catalog for audiobookshelf client'
}

export default async function ComponentsCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentUser, librariesRes] = await getData(getCurrentUser(), getLibraries())
  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect(`/login`)
  }

  return (
    <>
      <AppBar user={currentUser.user} libraries={librariesRes?.libraries} />
      <ComponentsCatalogProvider currentUser={currentUser} libraries={librariesRes?.libraries || []}>
        <div className="w-full h-full max-h-screen overflow-x-hidden overflow-y-auto">{children}</div>
      </ComponentsCatalogProvider>
    </>
  )
}
