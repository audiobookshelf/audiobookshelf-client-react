'use client'

import Btn from '@/components/ui/Btn'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookLibraryItem } from '@/types/api'

interface ChaptersEmptyStateProps {
  libraryItem: BookLibraryItem
}

/**
 * Shown on the item page when a book has audio tracks but no chapters yet.
 * Gives updaters a path to the chapter editor.
 */
export default function ChaptersEmptyState({ libraryItem }: ChaptersEmptyStateProps) {
  const t = useTypeSafeTranslations()
  const chaptersPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}/chapters`

  return (
    <CollapsibleSection
      title={t('HeaderChapters')}
      count={0}
      defaultExpanded
      headerActions={
        <Btn to={chaptersPath} color="bg-primary" size="small" className="me-2">
          {t('ButtonAddChapters')}
        </Btn>
      }
    >
      <div className="py-4 text-center" role="status">
        <p className="text-foreground-muted">{t('MessageNoChapters')}</p>
      </div>
    </CollapsibleSection>
  )
}
