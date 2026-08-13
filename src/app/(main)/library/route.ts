import { getCurrentUser, redirectToLogin } from '@/lib/api'
import { isNextRedirectError } from '@/lib/nextErrors'
import { getUserDefaultUrlPath } from '@/lib/userPermissions'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

/**
 * GET /library
 * Only serves to redirect to user default library or settings/account page
 */
export const GET = async (request: NextRequest) => {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser?.user) {
      return redirectToLogin(request, 'Unauthorized')
    }

    // Redirect to user default library or settings/account page
    const userDefaultLibraryId = currentUser.userDefaultLibraryId ?? null
    const userType = currentUser.user.type

    return redirect(getUserDefaultUrlPath(userDefaultLibraryId, userType))
  } catch (error) {
    // Re-throw redirect errors - they are not actual errors
    // Next.js redirects throw errors with NEXT_REDIRECT in the digest
    if (isNextRedirectError(error)) {
      throw error
    }
    // Stale cookies (e.g. after DB wipe / JWT secret rotation) look valid to the proxy
    // but fail authorize — redirectToLogin clears them so /login does not bounce back here.
    console.error('Error in library route:', error)
    return redirectToLogin(request, 'Unauthorized')
  }
}
