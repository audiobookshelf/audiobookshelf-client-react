import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { TranslationKey } from '@/types/translations'
import type { Metadata } from 'next'

export async function staticPageMetadata(key: TranslationKey): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t(key)
  }
}

export async function namedPageMetadata(name: string | undefined | null, namedKey: TranslationKey = 'TitleAudiobookshelfNamed'): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: name ? t(namedKey, { 0: name }) : t('TitleAudiobookshelf')
  }
}
