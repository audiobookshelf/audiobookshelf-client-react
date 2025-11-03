import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { theme } = await request.json()

    const availableThemes = ['light', 'dark', 'black']
    if (!theme || typeof theme !== 'string' || !availableThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme parameter' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('theme', theme, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60 // 1 year
    })

    return response
  } catch (error) {
    console.error('Set theme error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
