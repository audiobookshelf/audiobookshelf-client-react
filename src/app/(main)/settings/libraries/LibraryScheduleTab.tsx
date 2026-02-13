'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

export default function LibraryScheduleTab() {
  const t = useTypeSafeTranslations()

  return (
    <div className="text-foreground-muted text-sm">
      <p>{t('HeaderSchedule')}</p>
    </div>
  )
}
