import { getCurrentUser, getUserDefaultUrlPath } from '@/lib/api'
import { redirect } from 'next/navigation'

/**
 * GET /library
 * Only serves to redirect to user default library or settings/account page
 */
export const GET = async () => {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser?.user) {
      return redirect('/login')
    }

    // Redirect to user default library or settings/account page
    const userDefaultLibraryId = currentUser.userDefaultLibraryId ?? null
    const userType = currentUser.user.type

    return redirect(getUserDefaultUrlPath(userDefaultLibraryId, userType))
  } catch (error) {
    // Re-throw redirect errors - they are not actual errors
    // Next.js redirects throw errors with NEXT_REDIRECT in the digest
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    // Any other errors (including UnauthorizedError) should redirect to login
    console.error('Error in library route:', error)
    return redirect('/login')
  }
}
