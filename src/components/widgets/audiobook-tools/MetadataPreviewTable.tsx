'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { MetadataObject } from '@/types/api'

interface MetadataPreviewTableProps {
  metadataObject: MetadataObject | null
}

export default function MetadataPreviewTable({ metadataObject }: MetadataPreviewTableProps) {
  const t = useTypeSafeTranslations()
  const entries = metadataObject ? Object.entries(metadataObject) : []

  return (
    <div className="border-border bg-bg w-full border">
      <div className="flex px-4 py-2">
        <div className="text-foreground-muted w-28 min-w-28 text-xs font-semibold uppercase">{t('LabelMetaTag')}</div>
        <div className="text-foreground-muted grow text-xs font-semibold uppercase">{t('LabelValue')}</div>
      </div>
      <div className="max-h-72 w-full overflow-auto">
        {entries.map(([key, value], index) => (
          <div key={key} className={`flex px-4 py-1 text-sm ${index % 2 === 0 ? 'bg-primary/25' : ''}`}>
            <div className="w-28 min-w-28 font-semibold">{key}</div>
            <div className="grow break-words">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
