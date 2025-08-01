import type { Metadata } from 'next'
import '../../../assets/globals.css'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf - Components Catalog',
  description: 'Components catalog for audiobookshelf client'
}

export default async function ComponentsCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppBar />
      <div>{children}</div>
    </>
  )
}
