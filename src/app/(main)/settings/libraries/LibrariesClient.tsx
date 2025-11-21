'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Library } from '@/types/api'
import SettingsContent from '../SettingsContent'
import { saveLibraryOrder } from './actions'
import LibrariesList from './LibrariesList'

interface LibraryClientProps {
  libraries: Library[]
}

export default function LibrariesClient({ libraries }: LibraryClientProps) {
  const t = useTypeSafeTranslations()
  return (
    <SettingsContent
      title={t('HeaderLibraries')}
      addButton={{
        label: t('ButtonAddLibrary'),
        onClick: () => {
          console.log('TODO Add Library')
        }
      }}
      moreInfoUrl="https://www.audiobookshelf.org/guides/library_creation"
    >
      <LibrariesList libraries={libraries} saveLibraryOrderAction={saveLibraryOrder} />
    </SettingsContent>
  )
}
