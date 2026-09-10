import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import AppBarLoader from '../AppBarLoader'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfAccount')
}

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AppBarLoader />
      <div className="page-bg-gradient h-[calc(100vh-4rem)]">
        <div className="h-full w-full overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
