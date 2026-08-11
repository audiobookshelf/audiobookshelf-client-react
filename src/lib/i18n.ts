import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { matchAcceptLanguage } from './languages'

export default getRequestConfig(async () => {
  // Read locale with priority:
  // 1. userLanguage (user's personal preference)
  // 2. language (server default cookie)
  // 3. Accept-Language best match (first visit / init before cookie is set)
  // 4. 'en-us' (hardcoded fallback)
  const cookieStore = await cookies()
  const userLanguage = cookieStore.get('userLanguage')?.value
  const serverLanguage = cookieStore.get('language')?.value
  const acceptLanguage = matchAcceptLanguage((await headers()).get('accept-language'))
  const locale = userLanguage || serverLanguage || acceptLanguage || 'en-us'

  // Always load English as fallback
  const fallbackMessages = (await import(`../locales/en-us.json`)).default

  // Load the requested locale messages
  let messages = fallbackMessages
  if (locale !== 'en-us') {
    try {
      const localeMessages = (await import(`../locales/${locale}.json`)).default
      // Merge locale messages on top of fallback, so missing keys use English
      messages = { ...fallbackMessages, ...localeMessages }
    } catch {
      console.warn(`Failed to load messages for locale '${locale}', using en-us fallback`)
      messages = fallbackMessages
    }
  }

  return {
    locale,
    messages
  }
})
