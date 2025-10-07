import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { Library, User } from '@/types/api'
import Image from 'next/image'
import Link from 'next/link'
import AppBarNav from './AppBarNav'
import GlobalSearchInput from './GlobalSearchInput'
import LibrariesDropdown from './LibrariesDropdown'

interface AppBarProps {
  libraries?: Library[]
  currentLibraryId?: string
  user: User
}

export default async function AppBar({ libraries, currentLibraryId, user }: AppBarProps) {
  const t = await getTypeSafeTranslations()
  const userCanUpload = user.permissions.upload
  return (
    <div className="w-full h-16 bg-primary flex items-center justify-start px-2 md:px-6 gap-2 md:gap-4 shadow-xl">
      <Link href={'/'} title={t('ButtonHome')} className="text-sm text-foreground hover:text-foreground/80">
        <Image src="/icon.svg" alt="audiobookshelf" width={40} height={40} priority className="w-8 min-w-8 h-8 sm:w-10 sm:min-w-10 sm:h-10 mx-2" />
      </Link>
      <Link href={'/'} title={t('ButtonHome')} className="text-sm text-foreground hover:text-foreground/80 hidden lg:block">
        <h1 className="text-xl hover:underline">audiobookshelf</h1>
      </Link>
      {libraries && currentLibraryId && (
        <div className="hidden md:block">
          <LibrariesDropdown currentLibraryId={currentLibraryId} libraries={libraries} />
        </div>
      )}
      <div className="flex-1 min-w-0 max-w-40">
        <GlobalSearchInput />
      </div>
      <div className="ms-auto">
        <AppBarNav
          userCanUpload={userCanUpload}
          isAdmin={['admin', 'root'].includes(user.type)}
          username={user.username}
          libraries={libraries}
          currentLibraryId={currentLibraryId}
        />
      </div>
    </div>
  )
}
