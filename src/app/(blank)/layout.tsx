import { withBasePath } from '@/lib/basePath'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import Image from 'next/image'
import '../../assets/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleLogin')
}

export default function BlankLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="page-bg-gradient bleed-mx safe-px h-full">
      <div className="safe-px-2 md:safe-px-6 absolute start-0 top-0 flex h-16 w-full items-center justify-start">
        <Image src={withBasePath('/images/icon.svg')} alt="" width={40} height={40} className="me-2 h-8 w-8 min-w-8 sm:me-4 sm:h-10 sm:w-10 sm:min-w-10" />
        <p className="hidden text-xl lg:block">audiobookshelf</p>
      </div>
      <div className="h-dvh w-full overflow-x-hidden overflow-y-auto py-16">{children}</div>
    </div>
  )
}
