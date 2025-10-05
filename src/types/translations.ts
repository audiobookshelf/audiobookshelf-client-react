// Auto-generated types for translation keys
// Run `npm run generate-translation-types` to update

import type enUsMessages from '../locales/en-us.json'

type Messages = typeof enUsMessages
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}` : `${Key}`
}[keyof ObjectType & (string | number)]

export type TranslationKey = NestedKeyOf<Messages>

// Type-safe translation function
export interface TypeSafeTranslations {
  (key: TranslationKey): string
  (key: TranslationKey, values: Record<string, any>): string
  rich: {
    (key: TranslationKey, values: Record<string, any>): string
  }
}
