import { NextResponse } from 'next/server'
import { COOKIE_NAMES, setPreferenceCookie } from '@/lib/cookies'

export async function POST(request: Request) {
  try {
    const { theme } = await request.json()

    const availableThemes = ['light', 'dark', 'black']
    if (!theme || typeof theme !== 'string' || !availableThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme parameter' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    setPreferenceCookie(response.cookies, COOKIE_NAMES.theme, theme)

    return response
  } catch (error) {
    console.error('Set theme error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
