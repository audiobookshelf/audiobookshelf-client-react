import type { Metadata } from 'next'
import Image from 'next/image'
import '../../assets/globals.css'

export const metadata: Metadata = {
  title: 'audiobookshelf - Login'
}

export default function BlankLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="page-bg-gradient h-full">
      <div className="flex h-16 w-full items-center justify-start px-2 md:px-6">
        <Image src="/images/icon.svg" alt="" width={40} height={40} className="me-2 h-8 w-8 min-w-8 sm:me-4 sm:h-10 sm:w-10 sm:min-w-10" />
        <p className="hidden text-xl lg:block">audiobookshelf</p>
      </div>
      <div className="h-[calc(100vh-var(--header-height))]">
        <div className="h-full w-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
