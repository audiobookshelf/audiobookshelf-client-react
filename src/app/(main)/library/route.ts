import { getCurrentUser, getUserDefaultUrlPath } from '@/lib/api'
import { redirect } from 'next/navigation'

/**
 * GET /library
 * Only serves to redirect to user default library or settings/account page
 */
export const GET = async () => {
  const userResponse = await getCurrentUser()
  if (userResponse.error || !userResponse.data?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Redirect to user default library or settings/account page
  const userDefaultLibraryId = userResponse.data?.userDefaultLibraryId
  const userType = userResponse.data?.user?.type

  return redirect(getUserDefaultUrlPath(userDefaultLibraryId, userType))
}
