import { NextResponse } from 'next/server'

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
    const cookieName = scope === 'user' ? 'userLanguage' : 'language'

    const response = NextResponse.json({ success: true })
    response.cookies.set(cookieName, language, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60 // 1 year
    })

    return response
  } catch (error) {
    console.error('Set language error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
