import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const publicRoutes = ['/login']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = publicRoutes.includes(pathname)
  if (isPublicRoute) {
    return NextResponse.next()
  }

  const cookieStore = await cookies()
  const session = cookieStore.get('connect.sid')

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  } else if (isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
