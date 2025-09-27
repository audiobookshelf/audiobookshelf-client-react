import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import '../../../assets/globals.css'
import { getCurrentUser, getData } from '../../../lib/api'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf - Components Catalog',
  description: 'Components catalog for audiobookshelf client'
}

export default async function ComponentsCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [userResponse] = await getData(getCurrentUser())
  if (userResponse.error || !userResponse.data?.user) {
    console.error('Error getting user data:', userResponse)
    redirect(`/login`)
  }

  return (
    <>
      <AppBar user={userResponse.data.user} />
      <div>{children}</div>
    </>
  )
}
