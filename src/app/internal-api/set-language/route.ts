import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { language } = await request.json()

    if (!language || typeof language !== 'string') {
      return NextResponse.json({ error: 'Invalid language parameter' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('language', language, {
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
