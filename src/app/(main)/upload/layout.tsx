import type { Metadata } from 'next'
import '../../../assets/globals.css'
import AppBarLoader from '../AppBarLoader'
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
  return (
    <>
      <AppBarLoader />
      <UploadLayoutWrapper>{children}</UploadLayoutWrapper>
    </>
  )
}
