import { getCurrentUser, getUserDefaultUrlPath } from '@/lib/api'
import { redirect } from 'next/navigation'

/**
 * GET /library
 * Only serves to redirect to user default library or settings/account page
 */
export const GET = async () => {
  const userResponse = await getCurrentUser()
  if (userResponse.needsRefresh) {
    return redirect('/refresh?redirect=/library')
  }
  if (userResponse.error || !userResponse.data?.user) {
    return redirect('/login')
  }

  // Redirect to user default library or settings/account page
  const userDefaultLibraryId = userResponse.data?.userDefaultLibraryId
  const userType = userResponse.data?.user?.type

  return redirect(getUserDefaultUrlPath(userDefaultLibraryId, userType))
}
