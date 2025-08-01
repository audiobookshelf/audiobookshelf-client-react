import type { Metadata } from 'next'
import '../../../assets/globals.css'
import AppBar from '../AppBar'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppBar />
      <div>{children}</div>
    </>
  )
}
