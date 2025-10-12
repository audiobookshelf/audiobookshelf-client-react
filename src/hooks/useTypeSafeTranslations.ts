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

  return t as TypeSafeTranslations
}
