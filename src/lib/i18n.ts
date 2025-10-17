import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  // Read locale from cookie, fallback to 'en-us'
  const cookieStore = await cookies()
  const locale = cookieStore.get('language')?.value || 'en-us'

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
