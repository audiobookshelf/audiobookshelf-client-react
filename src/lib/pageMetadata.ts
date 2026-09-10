import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'

export async function namedPageMetadata(name: string | undefined | null): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: name ? t('TitleAudiobookshelfNamed', { 0: name }) : t('TitleAudiobookshelf')
  }
}
