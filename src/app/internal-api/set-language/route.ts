import { NextResponse } from 'next/server'
import { COOKIE_NAMES, setPreferenceCookie } from '@/lib/cookies'

export async function POST(request: Request) {
  try {
    const { language, scope = 'server' } = await request.json()

    if (!language || typeof language !== 'string') {
      return NextResponse.json({ error: 'Invalid language parameter' }, { status: 400 })
    }

    if (scope !== 'server' && scope !== 'user') {
      return NextResponse.json({ error: 'Invalid scope parameter. Must be "server" or "user"' }, { status: 400 })
    }

    // User-specific language cookie or default server language cookie
    const cookieName = scope === 'user' ? COOKIE_NAMES.userLanguage : COOKIE_NAMES.language

    const response = NextResponse.json({ success: true })
    setPreferenceCookie(response.cookies, cookieName, language)

    return response
  } catch (error) {
    console.error('Set language error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
