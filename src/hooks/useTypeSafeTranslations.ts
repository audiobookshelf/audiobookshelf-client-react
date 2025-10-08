'use client'

import type { TypeSafeTranslations } from '@/types/translations'
import { useTranslations } from 'next-intl'

/**
 * Type-safe wrapper for useTranslations that provides compile-time checking
 * of translation keys against your en-us.json file.
 *
 * Usage:
 * const t = useTypeSafeTranslations()
 * const text = t('ButtonSave') // ✅ Type-safe
 * const invalid = t('NonExistentKey') // ❌ TypeScript error
 */
export function useTypeSafeTranslations(): TypeSafeTranslations {
  const t = useTranslations()

  const translationFunction = ((key: string, values?: Record<string, any>) => {
    return t(key, values)
  }) as TypeSafeTranslations

  translationFunction.rich = ((key: string, values: Record<string, any>) => {
    return t.rich(key, values)
  }) as TypeSafeTranslations['rich']

  return translationFunction
}
