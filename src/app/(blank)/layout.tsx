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
    <>
      <div className="w-full h-16 bg-primary flex items-center justify-start px-4">
        <p className="text-white text-2xl font-bold">audiobookshelf</p>
      </div>
      <div>{children}</div>
    </>
  )
}
