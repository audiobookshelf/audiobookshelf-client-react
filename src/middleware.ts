import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/api'

const publicRoutes = ['/login']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = publicRoutes.includes(pathname)
  if (isPublicRoute) {
    return NextResponse.next()
  }

  const user = await getCurrentUser()
  if (user.error || !user.data?.user) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (pathname === '/') {
    const userDefaultLibraryId = user.data?.userDefaultLibraryId
    if (!userDefaultLibraryId) {
      // Redirect to config when there are no libraries
      return NextResponse.redirect(new URL('/config', request.nextUrl))
    }
    // Redirect to default library
    return NextResponse.redirect(new URL(`/library/${userDefaultLibraryId}`, request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
