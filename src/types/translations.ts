// Auto-generated types for translation keys
// Just change the en-us.json file to add keys

import { RichTagsFunction } from 'next-intl'
import type { ReactNode } from 'react'
import type enUsMessages from '../locales/en-us.json'

type Messages = typeof enUsMessages
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}` : `${Key}`
}[keyof ObjectType & (string | number)]

export type TranslationKey = NestedKeyOf<Messages>

// Type-safe translation function
export interface TypeSafeTranslations {
  (key: TranslationKey): string
  (key: TranslationKey, values: Record<string, string | number>): string
  rich: {
    (key: TranslationKey, values: Record<string, string | number | ReactNode | RichTagsFunction>): ReactNode
  }
}
