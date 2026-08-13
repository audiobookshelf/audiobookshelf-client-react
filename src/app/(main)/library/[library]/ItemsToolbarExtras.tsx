'use client'

import LibraryFilterSelect from '@/app/(main)/library/[library]/LibraryFilterSelect'
import LibrarySortSelect from '@/app/(main)/library/[library]/LibrarySortSelect'
import RemoveAllIssuesButton from '@/app/(main)/library/[library]/RemoveAllIssuesButton'
import { isLibraryIssuesPage } from '@/hooks/useLibraryRouteGuard'
import { Library, User } from '@/types/api'
import { usePathname } from 'next/navigation'

interface ItemsToolbarExtrasProps {
  user: User
  library: Library
}

export default function ItemsToolbarExtras({ user, library }: ItemsToolbarExtrasProps) {
  const pathname = usePathname()
  const onIssuesPage = isLibraryIssuesPage(pathname)

  return (
    <>
      {!onIssuesPage && <LibraryFilterSelect user={user} entityType="items" />}
      <LibrarySortSelect entityType="items" libraryMediaType={library.mediaType} />
      <RemoveAllIssuesButton />
    </>
  )
}
