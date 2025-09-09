import type { Metadata } from 'next'
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
    <div className="h-full page-bg-gradient">
      <div className="w-full h-16 flex items-center justify-start px-2 md:px-6">
        <img src="/icon.svg" alt="audiobookshelf" className="w-8 min-w-8 h-8 me-2 sm:w-10 sm:min-w-10 sm:h-10 sm:me-4" />
        <p className="text-xl hidden lg:block">audiobookshelf</p>
      </div>
      <div className="h-[calc(100vh-var(--header-height))]">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
