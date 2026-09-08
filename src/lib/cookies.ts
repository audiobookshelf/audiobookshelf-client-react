/** Preference cookies. Auth cookie names are still literals across api.ts, proxy.ts and the internal-api routes */
export const COOKIE_NAMES = {
  theme: 'theme',
  language: 'language',
  userLanguage: 'userLanguage',
  coverSize: 'bookshelfCoverSize',
  mobileCoverSize: 'bookshelfCoverSizeMobile',
  mobileViewport: 'isMobileViewport'
} as const

export type PreferenceCookieOptions = {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
  maxAge: number
}

/** Not httpOnly, since preferences are read during SSR */
export const PREFERENCE_COOKIE_OPTIONS: PreferenceCookieOptions = {
  httpOnly: false,
  secure: false,
  sameSite: 'lax',
  path: '/',
  maxAge: 365 * 24 * 60 * 60 // 1 year
}

/** Shape shared by `response.cookies` and `cookies()` from `next/headers` */
export type CookieSetter = {
  set(name: string, value: string, options: PreferenceCookieOptions): void
}

export function setPreferenceCookie(store: CookieSetter, name: string, value: string) {
  store.set(name, value, PREFERENCE_COOKIE_OPTIONS)
}

/** Browser equivalent of setPreferenceCookie. httpOnly is dropped because script cannot set it */
export function writePreferenceCookie(name: string, value: string) {
  const { path, maxAge, sameSite, secure } = PREFERENCE_COOKIE_OPTIONS
  const attributes = [`Path=${path}`, `Max-Age=${maxAge}`, `SameSite=${sameSite}`]
  if (secure) attributes.push('Secure')
  document.cookie = `${name}=${encodeURIComponent(value)}; ${attributes.join('; ')}`
}
