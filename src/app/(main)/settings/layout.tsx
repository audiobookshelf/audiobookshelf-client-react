import type { Metadata } from 'next'
import '../../../assets/globals.css'
import AppBar from '../AppBar'
import SideNav from './SideNav'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppBar />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <SideNav />
        <div className="flex-1 min-w-0">
          <div className="w-full h-[calc(100%-4rem)] overflow-x-hidden overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  )
}
