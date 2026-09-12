import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/cookies'

export type ThemeName = 'light' | 'dark' | 'black' | string

export const DEFAULT_THEME: ThemeName = 'dark'

/**
 * Get the current theme from cookies (server-side)
 * Returns the theme cookie value or the default theme
 */
export async function getTheme(): Promise<ThemeName> {
  const cookieStore = await cookies()
  const theme = cookieStore.get(COOKIE_NAMES.theme)?.value
  return theme || DEFAULT_THEME
}
