import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'
import Image from 'next/image'
import '../../assets/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleLogin')
  }
}

export default function BlankLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="page-bg-gradient h-full">
      <div className="absolute top-0 left-0 flex h-16 w-full items-center justify-start px-2 md:px-6">
        <Image src="/images/icon.svg" alt="" width={40} height={40} className="me-2 h-8 w-8 min-w-8 sm:me-4 sm:h-10 sm:w-10 sm:min-w-10" />
        <p className="hidden text-xl lg:block">audiobookshelf</p>
      </div>
      <div className="h-screen w-full overflow-x-hidden overflow-y-auto">{children}</div>
    </div>
  )
}
