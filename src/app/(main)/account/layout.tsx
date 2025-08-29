import type { Metadata } from 'next'
import '../../../assets/globals.css'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppBar />
      <div className="page-bg-gradient h-[calc(100vh-4rem)]">
        <div className="w-full h-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
