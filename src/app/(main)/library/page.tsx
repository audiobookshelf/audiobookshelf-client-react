import { getCurrentUser, getData, getLibraries } from '@/lib/api'
import { resolveEffectiveLibrary } from '@/lib/libraries'
import { redirect } from 'next/navigation'
import AppBarLoader from '../AppBarLoader'
import LibraryHomeEmptyClient from './LibraryHomeEmptyClient'

export const dynamic = 'force-dynamic'

/**
 * GET /library — home entry.
 * Redirects to the effective library when one exists; otherwise shows the empty-libraries state.
 */
export default async function LibraryHomePage() {
  const [currentUser, librariesResponse] = await getData(getCurrentUser(), getLibraries())

  if (!currentUser?.user) {
    console.error('Error getting user data')
    redirect('/login')
  }

  const libraries = librariesResponse?.libraries || []
  const preferredLibraryId = currentUser.userDefaultLibraryId ?? null
  const effectiveLibrary = resolveEffectiveLibrary(libraries, preferredLibraryId)

  if (effectiveLibrary) {
    redirect(`/library/${effectiveLibrary.id}`)
  }

  return (
    <>
      <AppBarLoader />
      <div className="page-bg-gradient h-[calc(100vh-4rem)]">
        <div className="h-full w-full overflow-x-hidden overflow-y-auto">
          <LibraryHomeEmptyClient />
        </div>
      </div>
    </>
  )
}
