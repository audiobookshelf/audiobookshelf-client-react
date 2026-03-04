import type { Metadata } from 'next'
import '../../../assets/globals.css'
import { ComponentsCatalogProvider } from '../../../contexts/ComponentsCatalogContext'
import { getData, getLibraries } from '../../../lib/api'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf - Components Catalog',
  description: 'Components catalog for audiobookshelf client'
}

export default async function ComponentsCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [librariesRes] = await getData(getLibraries())

  return (
    <>
      <AppBar libraries={librariesRes?.libraries} />
      <ComponentsCatalogProvider libraries={librariesRes?.libraries || []}>
        <div className="w-full h-full max-h-screen overflow-x-hidden overflow-y-auto">{children}</div>
      </ComponentsCatalogProvider>
    </>
  )
}
