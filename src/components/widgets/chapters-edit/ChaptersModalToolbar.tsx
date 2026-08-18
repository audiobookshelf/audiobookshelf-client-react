'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { ChaptersToolbarPanelId } from '@/hooks/useChapterEditor'

interface ChaptersModalToolbarProps {
  activePanel: ChaptersToolbarPanelId | null
  isLookupPending?: boolean
  onTogglePanel: (panel: ChaptersToolbarPanelId) => void
}

export default function ChaptersModalToolbar({ activePanel, isLookupPending = false, onTogglePanel }: ChaptersModalToolbarProps) {
  const t = useTypeSafeTranslations()

  return (
    <>
      <Btn color={activePanel === 'setFromTracks' ? 'bg-bg' : 'bg-primary'} size="small" onClick={() => onTogglePanel('setFromTracks')}>
        {t('ButtonSetChaptersFromTracks')}
      </Btn>

      <Btn
        color={activePanel === 'lookup' || isLookupPending ? 'bg-bg' : 'bg-primary'}
        size="small"
        loading={isLookupPending}
        onClick={() => onTogglePanel('lookup')}
      >
        {t('ButtonLookup')}
      </Btn>
    </>
  )
}
