import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'
import '../../../assets/globals.css'
import AppBarLoader from '../AppBarLoader'
import UploadLayoutWrapper from './UploadLayoutWrapper'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleUpload'),
    description: 'Upload page for audiobookshelf client'
  }
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
