import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import '../../../assets/globals.css'
import { ComponentsCatalogProvider } from '../../../contexts/ComponentsCatalogContext'
import { getData, getLibraries } from '../../../lib/api'
import AppBarLoader from '../AppBarLoader'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleComponents')
}

export default async function ComponentsCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [librariesRes] = await getData(getLibraries())

  return (
    <>
      <AppBarLoader />
      <ComponentsCatalogProvider libraries={librariesRes?.libraries || []}>
        <div className="h-full max-h-screen w-full overflow-x-hidden overflow-y-auto">{children}</div>
      </ComponentsCatalogProvider>
    </>
  )
}
