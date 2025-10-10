import type { TypeSafeTranslations } from '@/types/translations'
import { getTranslations } from 'next-intl/server'

/**
 * Type-safe wrapper for getTranslations (server components) that provides
 * compile-time checking of translation keys against your en-us.json file.
 *
 * Usage:
 * const t = await getTypeSafeTranslations()
 * const text = t('ButtonSave') // ✅ Type-safe
 * const invalid = t('NonExistentKey') // ❌ TypeScript error
 */
export async function getTypeSafeTranslations(): Promise<TypeSafeTranslations> {
  const t = await getTranslations()

  return t as TypeSafeTranslations
}
