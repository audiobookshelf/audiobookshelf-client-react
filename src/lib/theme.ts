import { cookies } from 'next/headers'

export type ThemeName = 'light' | 'dark' | 'black' | string

export const DEFAULT_THEME: ThemeName = 'dark'

/**
 * Get the current theme from cookies (server-side)
 * Returns the theme cookie value or the default theme
 */
export async function getTheme(): Promise<ThemeName> {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value
  return theme || DEFAULT_THEME
}
